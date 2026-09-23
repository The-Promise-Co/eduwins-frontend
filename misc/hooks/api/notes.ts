import { useMutation, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { NoteItem, SessionNotes, WhiteboardSnapshotItem } from '@/misc/types/session';

/** Trailing debounce for note flushes — coalesces typing bursts into one PUT. */
const NOTES_DEBOUNCE_MS = 1500;
/** Cap so continuous typing still flushes at least every 5s. */
const NOTES_MAX_WAIT_MS = 5000;
/** Transient 429 retries with exponential backoff before rejecting to the UI. */
const RATE_LIMIT_MAX_RETRIES = 4;

type NotesSaveKind = 'personal' | 'shared';

type NotesWaiter = {
  resolve: () => void;
  reject: (err: unknown) => void;
};

type NotesQueueState = {
  personal?: NoteItem[];
  shared?: NoteItem[];
  personalWaiters: NotesWaiter[];
  sharedWaiters: NotesWaiter[];
  debounceTimer: ReturnType<typeof setTimeout> | null;
  maxWaitTimer: ReturnType<typeof setTimeout> | null;
  inflight: boolean;
  retryTimer: ReturnType<typeof setTimeout> | null;
};

const notesQueues = new Map<string, NotesQueueState>();
const notesQueueClients = new Map<string, QueryClient>();

function getNotesQueue(bookingId: string): NotesQueueState {
  let q = notesQueues.get(bookingId);
  if (!q) {
    q = {
      personalWaiters: [],
      sharedWaiters: [],
      debounceTimer: null,
      maxWaitTimer: null,
      inflight: false,
      retryTimer: null,
    };
    notesQueues.set(bookingId, q);
  }
  return q;
}

function clearNotesTimers(q: NotesQueueState) {
  if (q.debounceTimer) clearTimeout(q.debounceTimer);
  if (q.maxWaitTimer) clearTimeout(q.maxWaitTimer);
  q.debounceTimer = null;
  q.maxWaitTimer = null;
}

function settleWaiters(waiters: NotesWaiter[], ok: boolean, err?: unknown) {
  for (const w of waiters) {
    if (ok) w.resolve();
    else w.reject(err);
  }
  waiters.length = 0;
}

async function putNotesWithRateLimit(
  bookingId: string,
  body: { personalNotes?: NoteItem[]; sharedNotes?: NoteItem[] },
): Promise<void> {
  let delay = 2000;
  for (let attempt = 0; attempt <= RATE_LIMIT_MAX_RETRIES; attempt++) {
    try {
      await api.put(`/sessions/${bookingId}/notes`, body);
      return;
    } catch (err: any) {
      const status = err?.response?.status;
      const isLast = attempt === RATE_LIMIT_MAX_RETRIES;
      if (status === 429 && !isLast) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

function applyNotesSuccess(
  queryClient: QueryClient | undefined,
  bookingId: string,
  personal?: NoteItem[],
  shared?: NoteItem[],
) {
  if (!queryClient) return;
  // setQueryData only — full invalidate after every keystroke flush was
  // doubling traffic (notes GET + snapshots GET) and burning the rate limit.
  queryClient.setQueryData<SessionNotes>(['session', 'notes', bookingId], (old) => ({
    personalNotes: personal !== undefined ? personal : old?.personalNotes || [],
    sharedNotes: shared !== undefined ? shared : old?.sharedNotes || [],
    whiteboardSnapshots: old?.whiteboardSnapshots || [],
    snapshotSyncError: old?.snapshotSyncError,
    updatedAt: old?.updatedAt,
  }));
}

async function flushNotesQueue(bookingId: string): Promise<void> {
  const q = notesQueues.get(bookingId);
  if (!q || q.inflight) return;
  if (q.personal === undefined && q.shared === undefined) return;

  clearNotesTimers(q);
  const personal = q.personal;
  const shared = q.shared;
  // Take ownership of this payload; later enqueues during flight stage a new flush.
  q.personal = undefined;
  q.shared = undefined;
  q.inflight = true;

  const body: { personalNotes?: NoteItem[]; sharedNotes?: NoteItem[] } = {};
  if (personal !== undefined) body.personalNotes = personal;
  if (shared !== undefined) body.sharedNotes = shared;

  let failed = false;
  try {
    await putNotesWithRateLimit(bookingId, body);
    applyNotesSuccess(notesQueueClients.get(bookingId), bookingId, personal, shared);
    if (personal !== undefined) settleWaiters(q.personalWaiters, true);
    if (shared !== undefined) settleWaiters(q.sharedWaiters, true);
  } catch (err) {
    failed = true;
    // Keep payload so Retry can re-send; reject only this kind's waiters.
    if (personal !== undefined) {
      q.personal = personal;
      settleWaiters(q.personalWaiters, false, err);
    }
    if (shared !== undefined) {
      q.shared = shared;
      settleWaiters(q.sharedWaiters, false, err);
    }
  } finally {
    q.inflight = false;
    // Concurrent enqueues during flight: flush again. On failure the payload
    // stays staged for manual Retry only (no hot-loop).
    if (!failed && (q.personal !== undefined || q.shared !== undefined)) {
      scheduleNotesFlush(bookingId);
    }
  }
}

function scheduleNotesFlush(bookingId: string): void {
  const q = getNotesQueue(bookingId);
  if (q.debounceTimer) clearTimeout(q.debounceTimer);
  q.debounceTimer = setTimeout(() => {
    q.debounceTimer = null;
    void flushNotesQueue(bookingId);
  }, NOTES_DEBOUNCE_MS);

  if (!q.maxWaitTimer && !q.inflight) {
    q.maxWaitTimer = setTimeout(() => {
      q.maxWaitTimer = null;
      void flushNotesQueue(bookingId);
    }, NOTES_MAX_WAIT_MS);
  }
}

function enqueueNotesSave(
  queryClient: QueryClient,
  bookingId: string,
  kind: NotesSaveKind,
  notes: NoteItem[],
): Promise<void> {
  notesQueueClients.set(bookingId, queryClient);
  const q = getNotesQueue(bookingId);
  q[kind] = notes;
  return new Promise<void>((resolve, reject) => {
    (kind === 'personal' ? q.personalWaiters : q.sharedWaiters).push({ resolve, reject });
    scheduleNotesFlush(bookingId);
  });
}

/** Force an immediate flush (page hide / unmount). Best-effort. */
export function flushSessionNotes(bookingId: string): void {
  const q = notesQueues.get(bookingId);
  if (!q) return;
  if (q.personal === undefined && q.shared === undefined) return;
  clearNotesTimers(q);
  void flushNotesQueue(bookingId);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    for (const id of Array.from(notesQueues.keys())) flushSessionNotes(id);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      for (const id of Array.from(notesQueues.keys())) flushSessionNotes(id);
    }
  });
}

/** Snapshots captured but not yet confirmed by the server (outbox). */
function getPendingWhiteboardKey(bookingId: string) {
  return `eduwins_notes_${bookingId}_wb_pending`;
}

export function getPendingSnapshots(bookingId: string): WhiteboardSnapshotItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getPendingWhiteboardKey(bookingId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePendingSnapshots(bookingId: string, snapshots: WhiteboardSnapshotItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getPendingWhiteboardKey(bookingId), JSON.stringify(snapshots));
    } catch {
      // quota — pending queue simply unavailable
    }
  }
}

/** One-time cleanup of legacy per-browser note caches (DB is the source of truth). */
export function clearLegacyNotesCache(bookingId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`eduwins_notes_${bookingId}_personal`);
    localStorage.removeItem(`eduwins_notes_${bookingId}_shared`);
    localStorage.removeItem(`eduwins_notes_${bookingId}_wb_snapshots`);
  } catch {
    // ignore
  }
}

/**
 * Code-joined children carry no JWT. The notes/snapshots GETs require auth (and a
 * 401 would bounce them to /login via the api interceptor), so only
 * authenticated users fetch the authoritative server lists. Children receive
 * shared notes live via the LiveKit data channel instead.
 */
function hasAuthToken(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

async function postSnapshotToServer(
  bookingId: string,
  snapshot: WhiteboardSnapshotItem,
): Promise<void> {
  const { pending: _pending, ...payload } = snapshot;
  void _pending;
  await api.post(`/sessions/${bookingId}/whiteboard/snapshots`, payload);
}

export function normalizeNoteItems(raw: any, defaultTitle = 'Note'): NoteItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `note-${index + 1}`,
          title: `${defaultTitle} ${index + 1}`,
          content: item,
          color: 'yellow',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        id: item.id || `note-${index + 1}`,
        title: item.title || `${defaultTitle} ${index + 1}`,
        content: item.content || '',
        color: item.color || 'yellow',
        authorName: item.authorName,
        authorRole: item.authorRole,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
    });
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [
      {
        id: 'note-1',
        title: defaultTitle,
        content: raw,
        color: 'yellow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  return [];
}

export const useSessionNotes = (bookingId: string | undefined) => {
  return useQuery<SessionNotes>({
    queryKey: ['session', 'notes', bookingId],
    queryFn: async () => {
      if (!bookingId) return { personalNotes: [], sharedNotes: [], whiteboardSnapshots: [] };
      clearLegacyNotesCache(bookingId);

      // Unauthenticated (code-joined) participants: no DB fetch — shared notes
      // arrive over the LiveKit data channel. Pending snapshots stay visible.
      if (!hasAuthToken()) {
        const pending = getPendingSnapshots(bookingId).map((s) => ({ ...s, pending: true }));
        return { personalNotes: [], sharedNotes: [], whiteboardSnapshots: pending };
      }

      // The database is the source of truth. A failed notes fetch rejects so
      // callers show an error + retry instead of stale/empty local data.
      const res = await api.get<any>(`/sessions/${bookingId}/notes`);
      const serverData = res.data;
      const personal = normalizeNoteItems(serverData?.personalNotes, 'Personal Note');
      const shared = normalizeNoteItems(serverData?.sharedNotes, 'Shared Note');
      const embeddedSnapshots = Array.isArray(serverData?.whiteboardSnapshots)
        ? serverData.whiteboardSnapshots
        : undefined;

      // Snapshots: the dedicated endpoint is authoritative when present.
      let snapshots: WhiteboardSnapshotItem[] = embeddedSnapshots ?? [];
      let snapshotSyncError = false;
      try {
        const snapRes = await api.get<{ snapshots?: WhiteboardSnapshotItem[] }>(
          `/sessions/${bookingId}/whiteboard/snapshots`,
        );
        if (Array.isArray(snapRes.data?.snapshots)) {
          snapshots = snapRes.data.snapshots;
        } else if (embeddedSnapshots === undefined) {
          snapshots = [];
        }
      } catch {
        // Notes succeeded but the snapshot list failed — surface honestly.
        snapshotSyncError = embeddedSnapshots === undefined;
        if (embeddedSnapshots === undefined) snapshots = [];
      }

      const pending = getPendingSnapshots(bookingId).map((s) => ({ ...s, pending: true }));
      const seen = new Set(snapshots.map((s) => s.id));
      const merged = [...snapshots, ...pending.filter((s) => !seen.has(s.id))];
      return {
        personalNotes: personal,
        sharedNotes: shared,
        whiteboardSnapshots: merged,
        snapshotSyncError,
        updatedAt: serverData?.updatedAt,
      };
    },
    enabled: !!bookingId,
    // Every remount reloads the full session from the DB.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const useSavePersonalNotes = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  // Queued: latest-wins debounce + batch PUT with 429 backoff. Promise settles
  // when this payload actually hits the DB (or fails) so callers can flag retry.
  return {
    mutateAsync: (notes: NoteItem[]) => {
      if (!bookingId) return Promise.reject(new Error('Missing booking id'));
      return enqueueNotesSave(queryClient, bookingId, 'personal', notes);
    },
  };
};

export const useSaveSharedNotes = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return {
    mutateAsync: (notes: NoteItem[]) => {
      if (!bookingId) return Promise.reject(new Error('Missing booking id'));
      return enqueueNotesSave(queryClient, bookingId, 'shared', notes);
    },
  };
};

export const useSaveWhiteboardSnapshot = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    // Strict save: the snapshot lands in the pending outbox first, then the
    // POST must succeed (201) or the mutation rejects — callers toast and
    // offer retry instead of pretending it saved. The idempotent backend
    // (upsert on client id) makes every retry safe.
    mutationFn: async (snapshot: WhiteboardSnapshotItem) => {
      if (!bookingId) throw new Error('Missing booking id');
      const { pending: _pending, ...clean } = snapshot;
      void _pending;
      savePendingSnapshots(bookingId, [...getPendingSnapshots(bookingId), clean]);
      await postSnapshotToServer(bookingId, clean);
      savePendingSnapshots(
        bookingId,
        getPendingSnapshots(bookingId).filter((s) => s.id !== clean.id),
      );
      return clean;
    },
    onSuccess: () => {
      if (bookingId) {
        // Refetch the authoritative server list (gallery shows DB truth).
        queryClient.invalidateQueries({ queryKey: ['session', 'notes', bookingId] });
      }
    },
  });
};

/** Replay the pending outbox in one batch POST, then refetch. Returns counts. */
export const useRetrySnapshotSync = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!bookingId) return { saved: 0, failed: 0 };
      const pending = getPendingSnapshots(bookingId);
      if (pending.length === 0) return { saved: 0, failed: 0 };

      try {
        await api.post(`/sessions/${bookingId}/whiteboard/snapshots/batch`, {
          snapshots: pending.map(({ pending: _p, ...rest }) => {
            void _p;
            return rest;
          }),
        });
        savePendingSnapshots(bookingId, []);
        return { saved: pending.length, failed: 0 };
      } catch {
        // Batch rejected — fall back to per-snapshot so partial progress sticks.
        const results = await Promise.allSettled(pending.map((s) => postSnapshotToServer(bookingId, s)));
        const failedIds = new Set(
          results
            .map((r, i) => ({ r, i }))
            .filter(({ r }) => r.status === 'rejected')
            .map(({ i }) => pending[i].id),
        );
        savePendingSnapshots(
          bookingId,
          pending.filter((s) => failedIds.has(s.id)),
        );
        return { saved: pending.length - failedIds.size, failed: failedIds.size };
      }
    },
    onSettled: () => {
      if (bookingId) {
        queryClient.invalidateQueries({ queryKey: ['session', 'notes', bookingId] });
      }
    },
  });
};
