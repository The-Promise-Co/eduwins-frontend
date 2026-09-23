/**
 * LiveKit transport helpers for the whiteboard.
 *
 * Conventions (match the existing room code):
 * - JSON-encoded payloads via `localParticipant.publishData`.
 * - Drawing updates: reliable channel, base64 Yjs updates, chunked.
 * - Cursor presence: lossy channel, small JSON messages.
 */
import type { Room } from 'livekit-client';
import { ConnectionState } from 'livekit-client';
import { WB, type WhiteboardChunkMsg } from './types';
import { splitIntoChunks, makeMsgId } from './utils';

const encoder = new TextEncoder();

/**
 * True only when the room is actually connected. Publishing before the
 * LiveKit connection completes silently drops the message — this was the
 * rejoin-blank race (sync request fired pre-connect, no peer ever replied).
 */
export function isRoomConnected(room: Room | null | undefined): room is Room {
  return !!room?.localParticipant && room.state === ConnectionState.Connected;
}

function isConnected(room: Room | null | undefined): room is Room {
  return isRoomConnected(room);
}

export function publishReliable(room: Room | null | undefined, payload: unknown): void {
  if (!isConnected(room)) return;
  try {
    void room.localParticipant
      .publishData(encoder.encode(JSON.stringify(payload)), { reliable: true })
      .catch(() => {
        // Room may close between check and publish — best effort.
      });
  } catch {
    // best-effort
  }
}

export function publishLossy(room: Room | null | undefined, payload: unknown): void {
  if (!isConnected(room)) return;
  try {
    void room.localParticipant
      .publishData(encoder.encode(JSON.stringify(payload)), { reliable: false })
      .catch(() => {
        // best-effort
      });
  } catch {
    // best-effort
  }
}

/** Publish a base64 Yjs update in wire-safe chunks. */
export function publishUpdateChunks(
  room: Room | null | undefined,
  type: WhiteboardChunkMsg['type'],
  b64: string,
): void {
  if (!isConnected(room)) return;
  const chunks = splitIntoChunks(b64);
  const msgId = makeMsgId();
  const total = chunks.length;
  chunks.forEach((chunk, index) => {
    publishReliable(room, {
      type,
      msgId,
      index,
      total,
      chunk,
    } satisfies WhiteboardChunkMsg);
  });
}

type ReassemblyBuffer = {
  total: number;
  parts: (string | undefined)[];
  received: number;
};

const buffers = new Map<string, ReassemblyBuffer>();

/**
 * Feed one chunk message; returns the complete base64 payload once all parts
 * arrive, otherwise null. Stale buffers are keyed per msgId so concurrent
 * syncs from multiple peers don't interleave.
 */
export function feedChunk(msg: WhiteboardChunkMsg): string | null {
  const key = `${msg.type}:${msg.msgId}`;
  let buf = buffers.get(key);
  if (!buf) {
    buf = { total: msg.total, parts: new Array(msg.total), received: 0 };
    buffers.set(key, buf);
  }
  if (buf.parts[msg.index] === undefined) {
    buf.parts[msg.index] = msg.chunk;
    buf.received += 1;
  }
  if (buf.received >= buf.total) {
    buffers.delete(key);
    return buf.parts.join('');
  }
  return null;
}

/** Drop all pending reassembly buffers (call on session end / unmount). */
export function clearChunkBuffers(): void {
  buffers.clear();
}
