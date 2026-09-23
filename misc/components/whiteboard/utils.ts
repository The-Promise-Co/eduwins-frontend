/**
 * Small helpers for the whiteboard: base64 codec (browser-safe, chunked so we
 * never blow the call stack on large updates), chunk splitting, deterministic
 * cursor colors, and element-list comparisons.
 */

const B64_CHUNK_SIZE = 0x8000;
const MAX_WIRE_CHUNK = 12000; // chars per LiveKit data message (well under payload limits)

export function uint8ToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += B64_CHUNK_SIZE) {
    const slice = bytes.subarray(i, i + B64_CHUNK_SIZE);
    parts.push(String.fromCharCode.apply(null, slice as unknown as number[]));
  }
  return btoa(parts.join(''));
}

export function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Split a base64 payload into wire-safe chunks. */
export function splitIntoChunks(b64: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < b64.length; i += MAX_WIRE_CHUNK) out.push(b64.slice(i, i + MAX_WIRE_CHUNK));
  return out;
}

export function makeMsgId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const CURSOR_PALETTE = [
  '#001A72',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

/** Deterministic cursor color per participant identity. */
export function colorForIdentity(identity: string): string {
  let hash = 0;
  for (let i = 0; i < identity.length; i++) hash = (hash * 31 + identity.charCodeAt(i)) >>> 0;
  return CURSOR_PALETTE[hash % CURSOR_PALETTE.length];
}

export function hexToExcalidrawColor(hex: string): { background: string; stroke: string } {
  return { background: `${hex}33`, stroke: hex };
}

type IdVersioned = { id: string; version?: number; versionNonce?: number };

/**
 * Cheap equality check for two element lists (by id + version when available,
 * falling back to length + id order). Used to break onChange echo loops:
 * if the scene already matches Yjs state, there is nothing to commit.
 */
export function sameElementList(a: readonly IdVersioned[], b: readonly IdVersioned[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id) return false;
    if (x.version !== undefined && y.version !== undefined) {
      if (x.version !== y.version || x.versionNonce !== y.versionNonce) return false;
    }
  }
  return true;
}
