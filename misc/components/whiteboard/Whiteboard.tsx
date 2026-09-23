'use client';

/**
 * Excalidraw-based whiteboard (replaces the tldraw SessionWhiteboard).
 *
 * - Live drawing state lives only in memory (Yjs doc, see useWhiteboardSync)
 *   and syncs over LiveKit data channels. Nothing is auto-persisted.
 * - Snapshots (PNG preview + scene JSON) are the only persistent artifact.
 * - Images use Excalidraw's native image tool (toolbar / paste / drop).
 *   Local binaries upload to R2 in the background; only URL refs sync.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@excalidraw/excalidraw/index.css';
import './whiteboard.css';
import { useRoomContext } from '@livekit/components-react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { Camera, Lock, Unlock, Trash2, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useR2 } from '@/misc/hooks/useR2';
import type { WhiteboardProps, WhiteboardSnapshotData } from './types';
import { captureSnapshot } from './snapshot';
import type { UploadImageFn } from './ExcalidrawCanvas';

const ExcalidrawCanvas = dynamic(() => import('./ExcalidrawCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-gray-500">
      <Sparkles size={20} className="animate-spin mr-2" />
      <span className="text-xs font-semibold">Loading whiteboard…</span>
    </div>
  ),
});

export default function Whiteboard({
  bookingId,
  isTeacher,
  allowCollaboration,
  onToggleCollaboration,
  onClose,
  onTakeSnapshot,
  participantName,
  participantRole,
  theme,
}: WhiteboardProps) {
  const room = useRoomContext();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);

  const { uploadFile } = useR2();
  const uploadImageRef = useRef<UploadImageFn>(async (file) => uploadFile(file, 'whiteboard'));
  uploadImageRef.current = async (file) => uploadFile(file, 'whiteboard');

  const participantIdentity = room?.localParticipant?.identity ?? participantName ?? 'local';
  const displayName = participantName || (isTeacher ? 'Tutor' : 'Participant');

  // Excalidraw runtime assets resolve against the page origin in Next.js.
  useEffect(() => {
    try {
      (window as unknown as Record<string, unknown>).EXCALIDRAW_ASSET_PATH = `${window.location.origin}/`;
    } catch {
      // ignore
    }
  }, []);

  const handleTakeSnapshot = useCallback(async () => {
    if (!api) return;
    if (api.getSceneElements().length === 0) {
      toast.error('Whiteboard is empty. Draw something first!');
      return;
    }
    setIsTakingSnapshot(true);
    try {
      const snapshot: WhiteboardSnapshotData | null = await captureSnapshot(
        api,
        (file) => uploadImageRef.current(file),
        { name: displayName, role: participantRole || (isTeacher ? 'teacher' : 'parent') },
      );
      if (!snapshot) {
        toast.error('Could not capture whiteboard image');
        return;
      }
      onTakeSnapshot?.(snapshot);
      toast.success(`Whiteboard snapshot captured at ${snapshot.timestamp}!`);
    } catch (err: unknown) {
      toast.error(`Snapshot failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsTakingSnapshot(false);
    }
  }, [api, displayName, isTeacher, onTakeSnapshot, participantRole]);

  const handleClearBoard = useCallback(() => {
    if (!api) return;
    const elements = api.getSceneElements();
    if (elements.length === 0) return;
    // Deleting through the canvas keeps undo history intact and syncs via onChange.
    api.updateScene({ elements: [] });
  }, [api]);

  const isDark = theme === 'dark';

  return (
    <div className={`relative h-full w-full flex flex-col overflow-hidden rounded-2xl border ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Top Controls & Status Bar */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-md z-30 transition-colors ${isDark ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/95 border-gray-100 text-gray-900'}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#001A72] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            W
          </div>
          <span className="text-xs font-bold tracking-tight">Whiteboard</span>

          {!isTeacher && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${allowCollaboration ? (isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDark ? 'bg-amber-950/40 border-amber-500/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
              {allowCollaboration ? <Unlock size={11} /> : <Lock size={11} />}
              <span>{allowCollaboration ? 'Collaborative (You can draw)' : 'View-only (Teacher presenting)'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTakeSnapshot}
            disabled={isTakingSnapshot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                : 'bg-[#001A72] hover:bg-[#001A72]/90 text-white disabled:opacity-50'
            }`}
            title="Take a snapshot of the current whiteboard"
          >
            {isTakingSnapshot ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            <span>{isTakingSnapshot ? 'Saving...' : 'Take Snapshot'}</span>
          </button>

          {isTeacher && (
            <>
              <button
                onClick={onToggleCollaboration}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  allowCollaboration
                    ? isDark
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
                title={allowCollaboration ? 'Students can draw' : 'Students are view-only'}
              >
                {allowCollaboration ? <Unlock size={13} /> : <Lock size={13} />}
                <span>{allowCollaboration ? 'Student Drawing: ON' : 'Student Drawing: OFF'}</span>
              </button>

              <button
                onClick={handleClearBoard}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                title="Clear all whiteboard content"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>

              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-xs font-semibold transition shadow-sm"
                  title="Close Whiteboard for everyone"
                >
                  <X size={13} />
                  <span>Close</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="eduwins-whiteboard flex-1 min-h-0 w-full relative">
        <ExcalidrawCanvas
          bookingId={bookingId}
          isTeacher={isTeacher}
          allowCollaboration={allowCollaboration}
          participantName={displayName}
          participantIdentity={participantIdentity}
          theme={theme}
          uploadImage={(file) => uploadImageRef.current(file)}
          onApi={setApi}
        />
      </div>
    </div>
  );
}
