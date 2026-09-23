/**
 * Shared types for the Excalidraw + Yjs + LiveKit whiteboard.
 *
 * Transport note: all whiteboard traffic goes over the existing LiveKit room
 * as JSON-encoded data-channel payloads (same convention as chat/hand-raise).
 * Yjs updates are binary, so they travel base64-encoded (and chunked when large).
 */

export type WhiteboardCursorPayload = {
  x: number;
  y: number;
  userId: string;
  name: string;
  color: string;
  tool?: 'pointer' | 'laser';
  button?: 'up' | 'down';
};

export type WhiteboardFileRef = {
  /** Public R2 URL the binary can be fetched from. */
  url: string;
  mimeType: string;
};

export type WhiteboardSnapshotData = {
  id: string;
  title: string;
  /** Full Excalidraw scene JSON (as produced by serializeAsJSON, type "database"). */
  scene: string;
  /** Public R2 URL of the PNG preview. Empty when upload failed (scene still saved). */
  imageUrl: string;
  timestamp: string;
  authorName?: string;
  authorRole?: 'parent' | 'teacher' | 'child';
  createdAt: string;
};

export interface WhiteboardProps {
  /** Booking id — enables same-device session restore. */
  bookingId: string;
  isTeacher: boolean;
  allowCollaboration: boolean;
  onToggleCollaboration?: () => void;
  onClose?: () => void;
  onTakeSnapshot?: (snapshot: WhiteboardSnapshotData) => void;
  participantName?: string;
  participantRole?: 'parent' | 'teacher' | 'child';
  theme: 'light' | 'dark';
}

/** LiveKit data-channel message types owned by the whiteboard. */
export const WB = {
  UPDATE_CHUNK: 'whiteboard:update-chunk',
  SYNC_REQUEST: 'whiteboard:sync-request',
  SYNC_REPLY_CHUNK: 'whiteboard:sync-reply-chunk',
  CURSOR: 'whiteboard:cursor',
  STATE: 'whiteboard:state',
  SESSION_ENDED: 'whiteboard:session-ended',
  SNAPSHOT_SAVED: 'whiteboard:snapshot-saved',
} as const;

export type WhiteboardStateMsg = {
  type: typeof WB.STATE;
  active: boolean;
  allowCollaboration: boolean;
};

export type WhiteboardChunkMsg = {
  type: typeof WB.UPDATE_CHUNK | typeof WB.SYNC_REPLY_CHUNK;
  msgId: string;
  index: number;
  total: number;
  chunk: string;
};

export type WhiteboardSyncRequestMsg = {
  type: typeof WB.SYNC_REQUEST;
  /** base64 state vector of the requester — replier sends only the diff. */
  stateVector: string;
  requestId: string;
};

export type WhiteboardCursorMsg = {
  type: typeof WB.CURSOR;
} & WhiteboardCursorPayload;

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * Structural whiteboard element. The Excalidraw package does not re-export
 * its element types from `@excalidraw/excalidraw/types`, so we model the
 * fields we rely on (identity + version for echo-guard comparisons) and cast
 * at the Excalidraw API boundary. Full element payloads round-trip through
 * Yjs as JSON untouched.
 */
export type WhiteboardElement = {
  id: string;
  version?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  fileId?: string | null;
  [key: string]: unknown;
};
