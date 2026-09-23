/**
 * Cursor presence over the lossy LiveKit data channel, rendered with
 * Excalidraw's native collaborator cursors (`updateScene({ collaborators })`).
 *
 * - Broadcast at most ~20 updates/sec while the pointer moves.
 * - Never persisted; entries expire after 5s without an update and are removed
 *   immediately when the participant leaves.
 */
import { useCallback, useEffect, useRef } from 'react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import type { Room } from 'livekit-client';
import type { ExcalidrawImperativeAPI, Collaborator, SocketId } from '@excalidraw/excalidraw/types';
import { WB, type WhiteboardCursorPayload } from './types';
import { colorForIdentity, hexToExcalidrawColor } from './utils';
import { publishLossy } from './livekitSync';

const BROADCAST_MIN_INTERVAL_MS = 50;
const CURSOR_TTL_MS = 5000;

const textDecoder = new TextDecoder();

interface CursorEntry extends WhiteboardCursorPayload {
  lastSeen: number;
}

interface UseCursorsOptions {
  api: ExcalidrawImperativeAPI | null;
  room: Room | null;
  userId: string;
  name: string;
}

export function useWhiteboardCursors({ api, room, userId, name }: UseCursorsOptions) {
  const cursorsRef = useRef<Map<string, CursorEntry>>(new Map());
  const lastBroadcastRef = useRef(0);
  const apiRef = useRef(api);
  apiRef.current = api;
  const metaRef = useRef({ userId, name });
  metaRef.current = { userId, name };

  // Push the current cursor set into Excalidraw (native collaborator rendering).
  const renderCollaborators = useCallback(() => {
    const liveApi = apiRef.current;
    if (!liveApi) return;
    const now = Date.now();
    const collaborators = new Map<SocketId, Collaborator>();
    let changed = false;
    cursorsRef.current.forEach((entry, id) => {
      if (now - entry.lastSeen > CURSOR_TTL_MS) {
        cursorsRef.current.delete(id);
        changed = true;
        return;
      }
      collaborators.set(id as SocketId, {
        pointer: { x: entry.x, y: entry.y, tool: entry.tool ?? 'pointer' },
        button: entry.button ?? 'up',
        username: entry.name,
        color: hexToExcalidrawColor(entry.color),
        id,
        socketId: id as SocketId,
      });
    });
    void changed;
    try {
      liveApi.updateScene({ collaborators });
    } catch {
      // ignore (e.g. unmounted)
    }
  }, []);

  // Throttled broadcast of our own pointer (called from onPointerUpdate).
  const broadcastCursor = useCallback(
    (payload: { x: number; y: number; tool?: 'pointer' | 'laser'; button?: 'up' | 'down' }) => {
      if (!room?.localParticipant) return;
      const now = Date.now();
      if (now - lastBroadcastRef.current < BROADCAST_MIN_INTERVAL_MS) return;
      lastBroadcastRef.current = now;
      const { userId: id, name: displayName } = metaRef.current;
      publishLossy(room, {
        type: WB.CURSOR,
        x: payload.x,
        y: payload.y,
        userId: id,
        name: displayName,
        color: colorForIdentity(id || displayName),
        tool: payload.tool ?? 'pointer',
        button: payload.button ?? 'up',
      } satisfies WhiteboardCursorPayload & { type: typeof WB.CURSOR });
    },
    [room],
  );

  // Receive remote cursors + expiry sweep + leave cleanup.
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      let data: any;
      try {
        data = JSON.parse(textDecoder.decode(payload));
      } catch {
        return;
      }
      if (!data || data.type !== WB.CURSOR || typeof data.x !== 'number' || typeof data.y !== 'number') {
        return;
      }
      const key = (data.userId as string) || participant?.identity || 'unknown';
      if (key === metaRef.current.userId) return; // ignore own echo (shouldn't happen)
      cursorsRef.current.set(key, {
        x: data.x,
        y: data.y,
        userId: key,
        name: data.name || 'Participant',
        color: data.color || colorForIdentity(key),
        tool: data.tool === 'laser' ? 'laser' : 'pointer',
        button: data.button === 'down' ? 'down' : 'up',
        lastSeen: Date.now(),
      });
      renderCollaborators();
    };

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      let removed = false;
      // Remove by identity and by any entry that arrived with that identity.
      if (cursorsRef.current.delete(participant.identity)) removed = true;
      cursorsRef.current.forEach((entry, key) => {
        if (entry.userId === participant.identity) {
          cursorsRef.current.delete(key);
          removed = true;
        }
      });
      if (removed) renderCollaborators();
    };

    const sweep = window.setInterval(renderCollaborators, 2000);

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      window.clearInterval(sweep);
      cursorsRef.current.clear();
    };
  }, [room, renderCollaborators]);

  // Clear collaborators when the canvas unmounts.
  useEffect(() => {
    return () => {
      cursorsRef.current.clear();
    };
  }, []);

  return { broadcastCursor };
}
