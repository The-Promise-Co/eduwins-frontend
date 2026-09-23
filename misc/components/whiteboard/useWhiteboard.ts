/**
 * Hand-rolled Yjs binding between one Excalidraw canvas and the LiveKit room.
 *
 * Model:
 * - Exactly one in-memory `Y.Doc` per mounted whiteboard.
 * - `elements`: Y.Map<elementId, elementJSON> — element-level replace granularity.
 * - `fileRefs`: Y.Map<fileId, WhiteboardFileRef JSON> — image binaries live on R2,
 *   only `{url, mimeType}` references sync (binaries NEVER go over LiveKit).
 * - Local edits commit into Yjs with a local origin; the doc-level `update`
 *   listener broadcasts incremental updates (reliable data channel, chunked).
 * - Remote updates apply with a remote origin and are never rebroadcast.
 * - Late joiners broadcast a state vector; every peer replies with the diff.
 *   (Any peer can reply — this also heals remounts after tab switches.)
 */
import { useCallback, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { ConnectionState, RoomEvent, type RemoteParticipant } from 'livekit-client';
import type { Room } from 'livekit-client';
import type { ExcalidrawImperativeAPI, BinaryFiles, BinaryFileData } from '@excalidraw/excalidraw/types';
import { WB, type WhiteboardElement, type WhiteboardFileRef } from './types';
import { uint8ToBase64, base64ToUint8, sameElementList } from './utils';
import { publishReliable, publishUpdateChunks, feedChunk, clearChunkBuffers } from './livekitSync';
import { saveSessionState, loadSessionState } from './sessionStore';

const LOCAL_ORIGIN = 'wb-local';
const REMOTE_ORIGIN = 'wb-remote';

const textDecoder = new TextDecoder();

type SceneElement = WhiteboardElement;

function elementToJSON(el: SceneElement): string {
  return JSON.stringify(el);
}

function jsonToElement(json: string): SceneElement {
  return JSON.parse(json) as SceneElement;
}

function readElements(map: Y.Map<string>): SceneElement[] {
  const out: SceneElement[] = [];
  map.forEach((value) => {
    try {
      out.push(jsonToElement(value as string));
    } catch {
      // ignore corrupt entries
    }
  });
  return out;
}

interface UseWhiteboardSyncOptions {
  api: ExcalidrawImperativeAPI | null;
  room: Room | null;
  /** Booking id enables same-device session restore (localStorage). */
  bookingId?: string;
}

const SESSION_SAVE_DEBOUNCE_MS = 1000;
const SYNC_MAX_ATTEMPTS = 3;
const SYNC_RETRY_MS = 2000;

export function useWhiteboardSync({ api, room, bookingId }: UseWhiteboardSyncOptions) {
  const docRef = useRef<Y.Doc | null>(null);
  const yElementsRef = useRef<Y.Map<string> | null>(null);
  const yFilesRef = useRef<Y.Map<string> | null>(null);
  const lastBroadcastVectorRef = useRef<Uint8Array | null>(null);
  const lastAppliedRef = useRef<readonly { id: string; version?: number; versionNonce?: number }[]>([]);
  const fetchingFilesRef = useRef<Set<string>>(new Set());
  const apiRef = useRef(api);
  apiRef.current = api;
  const roomRef = useRef(room);
  roomRef.current = room;
  const bookingIdRef = useRef(bookingId);
  bookingIdRef.current = bookingId;
  const settledRef = useRef<(() => void) | null>(null);

  // ── Fetch missing image binaries from R2 and register them locally ──
  const ensureFiles = useCallback((elements: readonly SceneElement[]) => {
    const liveApi = apiRef.current;
    const yFiles = yFilesRef.current;
    if (!liveApi || !yFiles) return;
    let localFiles: BinaryFiles = {};
    try {
      localFiles = liveApi.getFiles();
    } catch {
      return;
    }
    for (const el of elements) {
      const fileId = (el as { fileId?: string | null }).fileId;
      if (!fileId || localFiles[fileId] || fetchingFilesRef.current.has(fileId)) continue;
      const refJson = yFiles.get(fileId);
      if (!refJson) continue;
      let ref: WhiteboardFileRef;
      try {
        ref = JSON.parse(refJson as string) as WhiteboardFileRef;
      } catch {
        continue;
      }
      fetchingFilesRef.current.add(fileId);
      fetch(ref.url)
        .then((res) => {
          if (!res.ok) throw new Error(`fetch ${res.status}`);
          return res.blob();
        })
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(blob);
            }),
        )
        .then((dataURL) => {
          try {
            apiRef.current?.addFiles([
              { mimeType: ref.mimeType, id: fileId, dataURL, created: Date.now() } as unknown as BinaryFileData,
            ]);
          } catch {
            // ignore
          }
        })
        .catch(() => {
          // peers without the binary keep the placeholder — best effort
        })
        .finally(() => {
          fetchingFilesRef.current.delete(fileId);
        });
    }
  }, []);

  // ── Push Yjs element state into Excalidraw ──
  // - Skips when the canvas already matches (kills redundant scene replacements).
  // - Preserves locally drawn but not-yet-committed elements (e.g. a stroke
  //   in progress while a peer's update lands), so remote applies can never
  //   drop the stroke under the user's cursor.
  const applyElementsToScene = useCallback(
    (elements: SceneElement[]) => {
      const liveApi = apiRef.current;
      const yElements = yElementsRef.current;
      if (!liveApi || !yElements) return;
      let current: readonly SceneElement[] = [];
      try {
        current = liveApi.getSceneElements() as unknown as readonly SceneElement[];
      } catch {
        return;
      }
      const incomingIds = new Set(elements.map((el) => el.id));
      const keepers = current.filter((el) => !incomingIds.has(el.id) && !yElements.has(el.id));
      const merged = keepers.length > 0 ? [...elements, ...keepers] : elements;
      if (sameElementList(merged, current)) return;
      // Track only Y-known elements: keepers are uncommitted local strokes and
      // must still read as "new" when the gesture flushes, or they'd never sync.
      lastAppliedRef.current = elements.map((el) => ({
        id: el.id,
        version: el.version,
        versionNonce: el.versionNonce,
      }));
      try {
        liveApi.updateScene({ elements: merged as unknown as never });
      } catch {
        // ignore (e.g. unmounted)
      }
      ensureFiles(merged);
    },
    [ensureFiles],
  );

  // ── Whether a fileId already has a synced R2 reference (remote or uploaded) ──
  const isKnownFileRef = useCallback((fileId: string): boolean => {
    return yFilesRef.current?.has(fileId) ?? false;
  }, []);

  // ── Commit a local scene into Yjs (echo-safe) ──
  const commitLocalScene = useCallback(
    (elements: readonly SceneElement[], fileRefs?: Record<string, WhiteboardFileRef>) => {
      const doc = docRef.current;
      const yElements = yElementsRef.current;
      const yFiles = yFilesRef.current;
      if (!doc || !yElements || !yFiles) return;
      const elementsUnchanged = sameElementList(elements, lastAppliedRef.current);
      if (elementsUnchanged && !fileRefs) return;
      lastAppliedRef.current = elements.map((el) => ({
        id: el.id,
        version: el.version,
        versionNonce: el.versionNonce,
      }));
      doc.transact(() => {
        if (!elementsUnchanged) {
          const seen = new Set<string>();
          for (const el of elements) {
            seen.add(el.id);
            const json = elementToJSON(el);
            if (yElements.get(el.id) !== json) yElements.set(el.id, json);
          }
          const toDelete: string[] = [];
          yElements.forEach((_, id) => {
            if (!seen.has(id)) toDelete.push(id);
          });
          for (const id of toDelete) yElements.delete(id);
        }
        if (fileRefs) {
          for (const [fileId, ref] of Object.entries(fileRefs)) {
            yFiles.set(fileId, JSON.stringify(ref));
          }
        }
      }, LOCAL_ORIGIN);
    },
    [],
  );

  // ── Commit file refs only (background R2 uploads completing later) ──
  const commitFileRefs = useCallback((fileRefs: Record<string, WhiteboardFileRef>) => {
    const doc = docRef.current;
    const yFiles = yFilesRef.current;
    if (!doc || !yFiles) return;
    doc.transact(() => {
      for (const [fileId, ref] of Object.entries(fileRefs)) {
        yFiles.set(fileId, JSON.stringify(ref));
      }
    }, LOCAL_ORIGIN);
  }, []);

  const clearBoard = useCallback(() => {
    const doc = docRef.current;
    const yElements = yElementsRef.current;
    if (!doc || !yElements) return;
    lastAppliedRef.current = [];
    doc.transact(() => {
      yElements.clear();
    }, LOCAL_ORIGIN);
  }, []);

  // ── Doc + room wiring ──
  useEffect(() => {
    if (!api || !room) return;

    const doc = new Y.Doc();
    const yElements = doc.getMap<string>('elements');
    const yFiles = doc.getMap<string>('fileRefs');
    docRef.current = doc;
    yElementsRef.current = yElements;
    yFilesRef.current = yFiles;
    lastBroadcastVectorRef.current = Y.encodeStateVector(doc);

    // Local edits (any map) → broadcast incremental update + debounced
    // same-device session snapshot.
    let saveTimer: ReturnType<typeof setTimeout> | null = null;
    const handleUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin !== LOCAL_ORIGIN) return;
      const prev = lastBroadcastVectorRef.current;
      const diff = prev ? Y.encodeStateAsUpdate(doc, prev) : Y.encodeStateAsUpdate(doc);
      lastBroadcastVectorRef.current = Y.encodeStateVector(doc);
      if (diff.length <= 2) return; // empty update — nothing to send
      publishUpdateChunks(roomRef.current, WB.UPDATE_CHUNK, uint8ToBase64(diff));
      if (bookingId) {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const liveDoc = docRef.current;
          if (!liveDoc || !bookingIdRef.current) return;
          try {
            saveSessionState(bookingIdRef.current, Y.encodeStateAsUpdate(liveDoc));
          } catch {
            // quota — restore simply unavailable
          }
        }, SESSION_SAVE_DEBOUNCE_MS);
      }
    };
    doc.on('update', handleUpdate);

    // Remote element changes → scene. Own (local-origin) commits never
    // round-trip through updateScene — that re-entry mid-gesture is what
    // used to drop in-progress shapes on pointer-up.
    const handleElementsChange = (_event: Y.YMapEvent<string>, txn: Y.Transaction) => {
      if (txn.origin === LOCAL_ORIGIN) return;
      applyElementsToScene(readElements(yElements));
    };
    yElements.observe(handleElementsChange);

    // New file refs → fetch binaries for any element that needs them.
    const handleFilesChange = (_event: Y.YMapEvent<string>, txn: Y.Transaction) => {
      if (txn.origin === LOCAL_ORIGIN) return;
      const liveApi = apiRef.current;
      if (!liveApi) return;
      let current: readonly SceneElement[] = [];
      try {
        current = liveApi.getSceneElements() as unknown as readonly SceneElement[];
      } catch {
        return;
      }
      ensureFiles(current);
    };
    yFiles.observe(handleFilesChange);

    // ── Data channel ──
    const handleData = (payload: Uint8Array) => {
      let data: any;
      try {
        data = JSON.parse(textDecoder.decode(payload));
      } catch {
        return; // binary or malformed — not ours
      }
      if (!data || typeof data.type !== 'string') return;
      const liveDoc = docRef.current;
      if (!liveDoc) return;

      try {
        if (data.type === WB.UPDATE_CHUNK || data.type === WB.SYNC_REPLY_CHUNK) {
          const complete = feedChunk(data);
          if (!complete) return;
          const update = base64ToUint8(complete);
          Y.applyUpdate(liveDoc, update, REMOTE_ORIGIN);
          settledRef.current?.();
          // Fresh baseline (e.g. first sync): push full state into the canvas
          // in case observe ordering missed anything.
          if (data.type === WB.SYNC_REPLY_CHUNK) {
            applyElementsToScene(readElements(liveDoc.getMap<string>('elements')));
          }
        } else if (data.type === WB.SYNC_REQUEST && typeof data.stateVector === 'string') {
          const requesterVector = base64ToUint8(data.stateVector);
          const diff = Y.encodeStateAsUpdate(liveDoc, requesterVector);
          if (diff.length > 2) {
            publishUpdateChunks(roomRef.current, WB.SYNC_REPLY_CHUNK, uint8ToBase64(diff));
          }
        }
      } catch {
        // ignore corrupt updates
      }
    };

    room.on(RoomEvent.DataReceived, handleData);

    // Restore same-device session state (instant paint even when the room is
    // empty and no peer can answer the handshake). Applied with a remote
    // origin so it flows through the normal observe → scene path and is
    // never rebroadcast.
    if (bookingId) {
      const stored = loadSessionState(bookingId);
      if (stored) {
        try {
          Y.applyUpdate(doc, stored, REMOTE_ORIGIN);
        } catch {
          // corrupt snapshot — start blank and re-sync from peers
        }
      }
    }

    // Ask peers for the current board (late join / remount). Only meaningful
    // once connected — publishing pre-connect silently drops the request
    // (the rejoin-blank race), so also request on Connected and retry until
    // the first remote update lands (a genuinely empty board just expires).
    let settled = readElements(yElements).length > 0;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const markSettled = () => {
      settled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };
    settledRef.current = markSettled;
    const requestSync = () => {
      if (settled) return;
      if (room.state !== ConnectionState.Connected || !room.localParticipant) return;
      attempts += 1;
      try {
        publishReliable(room, {
          type: WB.SYNC_REQUEST,
          stateVector: uint8ToBase64(Y.encodeStateVector(doc)),
          requestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        });
      } catch {
        // best-effort
      }
      if (attempts < SYNC_MAX_ATTEMPTS && !settled) {
        retryTimer = setTimeout(requestSync, SYNC_RETRY_MS);
      }
    };
    const handleConnected = () => requestSync();
    room.on(RoomEvent.Connected, handleConnected);
    requestSync();

    // Seed echo guard with whatever is on the canvas now (empty on fresh mount).
    try {
      const current = api.getSceneElements() as unknown as readonly SceneElement[];
      lastAppliedRef.current = current.map((el) => ({
        id: el.id,
        version: (el as { version?: number }).version,
        versionNonce: (el as { versionNonce?: number }).versionNonce,
      }));
    } catch {
      // ignore
    }

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.Connected, handleConnected);
      if (retryTimer) clearTimeout(retryTimer);
      if (saveTimer) clearTimeout(saveTimer);
      settledRef.current = null;
      yElements.unobserve(handleElementsChange);
      yFiles.unobserve(handleFilesChange);
      doc.off('update', handleUpdate);
      clearChunkBuffers();
      doc.destroy();
      docRef.current = null;
      yElementsRef.current = null;
      yFilesRef.current = null;
      lastBroadcastVectorRef.current = null;
      fetchingFilesRef.current.clear();
    };
  }, [api, room, bookingId, applyElementsToScene, ensureFiles]);

  const broadcastSessionEnded = useCallback(() => {
    publishReliable(roomRef.current, { type: WB.SESSION_ENDED });
  }, []);

  return { commitLocalScene, commitFileRefs, isKnownFileRef, clearBoard, broadcastSessionEnded };
}
