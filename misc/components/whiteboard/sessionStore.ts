/**
 * Same-device, session-scoped board persistence.
 *
 * The live board is intentionally never stored on the server. This module
 * keeps a best-effort copy of the Yjs document in localStorage (per booking)
 * so a refresh, remount, or rejoin restores the board instantly — even if the
 * room emptied in the meantime and no peer can answer the sync handshake.
 *
 * Stored entries expire (a future session on the same booking must never
 * resurrect an old board) and are cleared when the teacher closes the board.
 */
import { uint8ToBase64, base64ToUint8 } from './utils';

const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12h — longer than any class session

type StoredState = {
  v: 1;
  savedAt: number;
  data: string;
};

function keyFor(bookingId: string): string {
  return `eduwins_wb_session_${bookingId}`;
}

/** Persist a full Yjs document snapshot (debounced by the caller). */
export function saveSessionState(bookingId: string, update: Uint8Array): void {
  if (typeof window === 'undefined' || !bookingId) return;
  try {
    const payload: StoredState = { v: 1, savedAt: Date.now(), data: uint8ToBase64(update) };
    localStorage.setItem(keyFor(bookingId), JSON.stringify(payload));
  } catch {
    // Quota or privacy mode — session restore simply unavailable.
  }
}

/** Load a stored snapshot, or null when missing, stale, or corrupt. */
export function loadSessionState(bookingId: string): Uint8Array | null {
  if (typeof window === 'undefined' || !bookingId) return null;
  try {
    const raw = localStorage.getItem(keyFor(bookingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || parsed.v !== 1 || typeof parsed.data !== 'string') return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(keyFor(bookingId));
      return null;
    }
    return base64ToUint8(parsed.data);
  } catch {
    return null;
  }
}

/** Drop the stored board (teacher closes the whiteboard). */
export function clearSessionState(bookingId: string): void {
  if (typeof window === 'undefined' || !bookingId) return;
  try {
    localStorage.removeItem(keyFor(bookingId));
  } catch {
    // ignore
  }
}
