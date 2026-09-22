import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { NoteItem, SessionNotes, WhiteboardSnapshotItem } from '@/misc/types/session';

function getLocalPersonalKey(bookingId: string) {
  return `eduwins_notes_${bookingId}_personal`;
}

function getLocalSharedKey(bookingId: string) {
  return `eduwins_notes_${bookingId}_shared`;
}

function getLocalWhiteboardKey(bookingId: string) {
  return `eduwins_notes_${bookingId}_wb_snapshots`;
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

export function getStoredNotes(bookingId: string): SessionNotes {
  if (typeof window === 'undefined') {
    return { personalNotes: [], sharedNotes: [], whiteboardSnapshots: [] };
  }
  try {
    const rawPersonal = localStorage.getItem(getLocalPersonalKey(bookingId));
    const rawShared = localStorage.getItem(getLocalSharedKey(bookingId));
    const rawSnapshots = localStorage.getItem(getLocalWhiteboardKey(bookingId));

    const personal = rawPersonal ? normalizeNoteItems(JSON.parse(rawPersonal), 'Personal Note') : [];
    const shared = rawShared ? normalizeNoteItems(JSON.parse(rawShared), 'Shared Note') : [];
    const snapshots: WhiteboardSnapshotItem[] = rawSnapshots ? JSON.parse(rawSnapshots) : [];

    return { personalNotes: personal, sharedNotes: shared, whiteboardSnapshots: snapshots };
  } catch {
    // If it was stored as raw plaintext string before
    const rawPersonal = localStorage.getItem(getLocalPersonalKey(bookingId)) || '';
    const rawShared = localStorage.getItem(getLocalSharedKey(bookingId)) || '';
    return {
      personalNotes: normalizeNoteItems(rawPersonal, 'Personal Note'),
      sharedNotes: normalizeNoteItems(rawShared, 'Shared Note'),
      whiteboardSnapshots: [],
    };
  }
}

export function saveStoredPersonalNotes(bookingId: string, notes: NoteItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLocalPersonalKey(bookingId), JSON.stringify(notes));
  }
}

export function saveStoredSharedNotes(bookingId: string, notes: NoteItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLocalSharedKey(bookingId), JSON.stringify(notes));
  }
}

export function saveStoredWhiteboardSnapshots(bookingId: string, snapshots: WhiteboardSnapshotItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getLocalWhiteboardKey(bookingId), JSON.stringify(snapshots));
  }
}

export const useSessionNotes = (bookingId: string | undefined) => {
  return useQuery<SessionNotes>({
    queryKey: ['session', 'notes', bookingId],
    queryFn: async () => {
      if (!bookingId) return { personalNotes: [], sharedNotes: [], whiteboardSnapshots: [] };
      const local = getStoredNotes(bookingId);
      try {
        const res = await api.get<any>(`/sessions/${bookingId}/notes`);
        const serverData = res.data;
        const personal = serverData?.personalNotes ? normalizeNoteItems(serverData.personalNotes, 'Personal Note') : local.personalNotes;
        const shared = serverData?.sharedNotes ? normalizeNoteItems(serverData.sharedNotes, 'Shared Note') : local.sharedNotes;
        const snapshots = Array.isArray(serverData?.whiteboardSnapshots) ? serverData.whiteboardSnapshots : local.whiteboardSnapshots || [];

        saveStoredPersonalNotes(bookingId, personal);
        saveStoredSharedNotes(bookingId, shared);
        saveStoredWhiteboardSnapshots(bookingId, snapshots);

        return {
          personalNotes: personal,
          sharedNotes: shared,
          whiteboardSnapshots: snapshots,
          updatedAt: serverData?.updatedAt,
        };
      } catch {
        // Fallback to locally stored notes & snapshots
        return local;
      }
    },
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });
};

export const useSavePersonalNotes = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notes: NoteItem[]) => {
      if (!bookingId) return;
      saveStoredPersonalNotes(bookingId, notes);
      try {
        await api.put(`/sessions/${bookingId}/notes/personal`, { notes });
      } catch {
        // Local save succeeded, API endpoint is optional/best-effort
      }
    },
    onSuccess: (_, notes) => {
      if (bookingId) {
        queryClient.setQueryData<SessionNotes>(['session', 'notes', bookingId], (old) => ({
          personalNotes: notes,
          sharedNotes: old?.sharedNotes || [],
          whiteboardSnapshots: old?.whiteboardSnapshots || [],
        }));
      }
    },
  });
};

export const useSaveSharedNotes = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notes: NoteItem[]) => {
      if (!bookingId) return;
      saveStoredSharedNotes(bookingId, notes);
      try {
        await api.put(`/sessions/${bookingId}/notes/shared`, { notes });
      } catch {
        // Local save succeeded, API endpoint is optional/best-effort
      }
    },
    onSuccess: (_, notes) => {
      if (bookingId) {
        queryClient.setQueryData<SessionNotes>(['session', 'notes', bookingId], (old) => ({
          personalNotes: old?.personalNotes || [],
          sharedNotes: notes,
          whiteboardSnapshots: old?.whiteboardSnapshots || [],
        }));
      }
    },
  });
};

export const useSaveWhiteboardSnapshot = (bookingId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshot: WhiteboardSnapshotItem) => {
      if (!bookingId) return;
      const local = getStoredNotes(bookingId);
      const updatedSnapshots = [...(local.whiteboardSnapshots || []), snapshot];
      saveStoredWhiteboardSnapshots(bookingId, updatedSnapshots);
      try {
        await api.post(`/sessions/${bookingId}/whiteboard/snapshots`, snapshot);
      } catch {
        // Local save succeeded
      }
      return updatedSnapshots;
    },
    onSuccess: (updatedSnapshots) => {
      if (bookingId && updatedSnapshots) {
        queryClient.setQueryData<SessionNotes>(['session', 'notes', bookingId], (old) => ({
          personalNotes: old?.personalNotes || [],
          sharedNotes: old?.sharedNotes || [],
          whiteboardSnapshots: updatedSnapshots,
        }));
      }
    },
  });
};
