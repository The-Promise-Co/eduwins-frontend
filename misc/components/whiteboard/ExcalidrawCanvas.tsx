'use client';

/**
 * The actual Excalidraw canvas. This module imports `@excalidraw/excalidraw`
 * at the top level, so it must ONLY ever be loaded via `next/dynamic` with
 * `ssr: false` (see Whiteboard.tsx) — Excalidraw does not support SSR.
 *
 * Images only: local image files (paste/drop/insert) are uploaded to R2 in
 * the background and only their `{url, mimeType}` refs sync via Yjs.
 * PDFs are never accepted.
 */
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw, MainMenu } from '@excalidraw/excalidraw';
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  BinaryFiles,
  BinaryFileData,
  AppState,
} from '@excalidraw/excalidraw/types';
import { useRoomContext } from '@livekit/components-react';
import { useWhiteboardSync } from './useWhiteboard';
import { useWhiteboardCursors } from './cursors';
import { ALLOWED_IMAGE_MIMES, type WhiteboardElement } from './types';

export type UploadImageFn = (file: File) => Promise<string | null>;

interface ExcalidrawCanvasProps {
  bookingId: string;
  isTeacher: boolean;
  allowCollaboration: boolean;
  participantName: string;
  participantIdentity: string;
  theme: 'light' | 'dark';
  uploadImage: UploadImageFn;
  onApi: (api: ExcalidrawImperativeAPI | null) => void;
}

/**
 * Commits happen AFTER a change completes, not while it's happening:
 * - Drawing gestures (pointer down → up) buffer every onChange and flush once
 *   on pointer-up, so Yjs never sees half-drawn strokes and nothing can
 *   round-trip through updateScene mid-gesture.
 * - Discrete edits without a gesture (undo/redo, style panel, text submit,
 *   image insert, Clear) flush via a short trailing debounce.
 */
const FALLBACK_DEBOUNCE_MS = 300;

export default function ExcalidrawCanvas({
  bookingId,
  isTeacher,
  allowCollaboration,
  participantName,
  participantIdentity,
  theme,
  uploadImage,
  onApi,
}: ExcalidrawCanvasProps) {
  const room = useRoomContext();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  const pendingElementsRef = useRef<readonly WhiteboardElement[] | null>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureActiveRef = useRef(false);
  const uploadingFilesRef = useRef<Set<string>>(new Set());
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;
  const onApiRef = useRef(onApi);
  onApiRef.current = onApi;

  const sync = useWhiteboardSync({ api, room, bookingId });
  const syncRef = useRef(sync);
  syncRef.current = sync;

  const cursors = useWhiteboardCursors({ api, room, userId: participantIdentity, name: participantName });
  const cursorsRef = useRef(cursors);
  cursorsRef.current = cursors;

  const handleApi = useCallback(
    (next: ExcalidrawImperativeAPI) => {
      setApi(next);
      onApiRef.current(next);
    },
    [],
  );

  useEffect(() => {
    return () => {
      onApiRef.current(null);
      // Don't lose a stroke if the board unmounts mid-gesture (no-op if the
      // Yjs doc is already destroyed).
      flushPendingRef.current();
    };
  }, []);

  const flushPending = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    const pending = pendingElementsRef.current;
    pendingElementsRef.current = null;
    if (pending) syncRef.current.commitLocalScene(pending);
  }, []);

  const flushPendingRef = useRef(flushPending);
  flushPendingRef.current = flushPending;

  const scheduleFallbackCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(flushPending, FALLBACK_DEBOUNCE_MS);
  }, [flushPending]);

  // Pointer down starts a gesture: commit any pre-gesture state first so the
  // stroke buffers from a clean baseline, then hold commits until pointer-up.
  const handlePointerDown = useCallback(() => {
    flushPending();
    gestureActiveRef.current = true;
  }, [flushPending]);

  // Gesture complete — sync the finished stroke(s) immediately.
  const handlePointerUp = useCallback(() => {
    gestureActiveRef.current = false;
    flushPending();
  }, [flushPending]);

  const registerLocalFile = useCallback((fileId: string, file: BinaryFileData) => {
    if (uploadingFilesRef.current.has(fileId)) return;
    if (syncRef.current.isKnownFileRef(fileId)) return;
    if (!ALLOWED_IMAGE_MIMES.includes(file.mimeType)) return; // images only — no PDFs
    uploadingFilesRef.current.add(fileId);
    fetch(file.dataURL)
      .then((res) => {
        if (!res.ok) throw new Error('decode failed');
        return res.blob();
      })
      .then((blob) => {
        const ext = (file.mimeType.split('/')[1] || 'png').split('+')[0];
        const uploadFile = new File([blob], `whiteboard-${fileId}.${ext}`, { type: file.mimeType });
        return uploadImageRef.current(uploadFile);
      })
      .then((publicUrl) => {
        if (publicUrl) {
          syncRef.current.commitFileRefs({ [fileId]: { url: publicUrl, mimeType: file.mimeType } });
        }
      })
      .catch(() => {
        // R2 upload failed — drawing still syncs, binary stays local-only
      })
      .finally(() => {
        uploadingFilesRef.current.delete(fileId);
      });
  }, []);

  const handleChange = useCallback(
    (_elements: readonly WhiteboardElement[], _appState: AppState, files: BinaryFiles) => {
      void _appState;
      // Register newly added local image files for R2 upload (fire-and-forget).
      for (const [fileId, file] of Object.entries(files)) {
        registerLocalFile(fileId, file as BinaryFileData);
      }
      // Buffer the latest scene. While a gesture is active we hold the commit
      // until pointer-up; discrete edits fall through to the debounce below.
      pendingElementsRef.current = _elements;
      if (gestureActiveRef.current) return;
      scheduleFallbackCommit();
    },
    [scheduleFallbackCommit, registerLocalFile],
  );

  const handlePointerUpdate = useCallback(
    (payload: { pointer: { x: number; y: number; tool: 'pointer' | 'laser' }; button: 'down' | 'up' }) => {
      cursorsRef.current.broadcastCursor({
        x: payload.pointer.x,
        y: payload.pointer.y,
        tool: payload.pointer.tool,
        button: payload.button,
      });
    },
    [],
  );

  const viewOnly = !isTeacher && !allowCollaboration;

  return (
    <Excalidraw
      excalidrawAPI={handleApi}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerUpdate={handlePointerUpdate}
      viewModeEnabled={viewOnly}
      isCollaborating
      theme={theme === 'dark' ? 'dark' : 'light'}
      UIOptions={{ tools: { image: true } }}
    >
      {/* Curated hamburger menu: external links (GitHub/Discord/X via
          Socials), Excalidraw's own LiveCollaborationTrigger, ToggleTheme
          (session theme is controlled), ChangeCanvasBackground (appState
          doesn't sync), SaveToActiveFile, and CommandPalette/SearchMenu
          (re-exposes every action incl. library) are all excluded. */}
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.SaveAsImage />
        <MainMenu.DefaultItems.Export />
        <MainMenu.DefaultItems.Help />
        <MainMenu.DefaultItems.ClearCanvas />
      </MainMenu>
    </Excalidraw>
  );
}
