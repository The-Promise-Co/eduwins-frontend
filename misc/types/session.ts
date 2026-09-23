export interface LiveKitConnectionDetails {
  server_url: string;
  participant_token: string;
}

export interface ChildJoinCode {
  childId: string;
  childName: string;
  code: string;
}

export interface SessionChildCodesResponse {
  bookingId: string;
  codes: ChildJoinCode[];
}

export interface SessionParticipant {
  identity: string;
  name: string;
  role: 'parent' | 'teacher' | 'child';
  childId?: string;
  joinedAt: string;
  leftAt?: string;
  isOnline: boolean;
}

export interface SessionEvent {
  id: string;
  bookingId: string;
  participantIdentity: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'child';
  childId?: string;
  event: 'joined' | 'left' | 'disconnected';
  timestamp: string;
}

export interface JoinSessionByCodeResponse {
  valid: boolean;
  bookingId: string;
  childId: string;
  childName: string;
  subject?: string;
  teacherName?: string;
  serverUrl: string;
  participantToken: string;
}

export const END_NOTIFICATION_THRESHOLDS = [20, 10, 5, 2] as const;

export const JOIN_WINDOW_MINUTES = 15;

export interface SessionTiming {
  scheduledStart: Date;
  scheduledEnd: Date;
  joinWindowOpen: Date;
  canJoin: boolean;
  isEnded: boolean;
  timeUntilStart: number;
  timeUntilEnd: number;
}

export type StickyNoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color?: StickyNoteColor;
  authorRole?: 'parent' | 'teacher' | 'child';
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteboardSnapshotItem {
  id: string;
  title: string;
  /** Full Excalidraw scene JSON (as produced by serializeAsJSON, type "database"). */
  scene: string;
  /** Public R2 URL of the PNG preview. May be empty when the upload failed. */
  imageUrl: string;
  timestamp: string; // Formatted time string e.g. "10:15 AM" or ISO
  authorName?: string;
  authorRole?: 'parent' | 'teacher' | 'child';
  createdAt: string;
  /** Client-only: not yet confirmed by the server (pending outbox). */
  pending?: boolean;
}

export interface SessionNotes {
  personalNotes: NoteItem[];
  sharedNotes: NoteItem[];
  whiteboardSnapshots?: WhiteboardSnapshotItem[];
  /** True when the authoritative server snapshot fetch failed (local/pending shown). */
  snapshotSyncError?: boolean;
  updatedAt?: string;
}

