'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { Camera, Check, Lock, Unlock, Trash2, X, Users, Sparkles, Loader2 } from 'lucide-react';
import { WhiteboardSnapshotItem } from '@/misc/types/session';
import { toast } from 'sonner';

export interface WhiteboardChanges {
  added: any[];
  updated: any[];
  removed: string[];
}

interface SessionWhiteboardProps {
  isTeacher: boolean;
  allowCollaboration: boolean;
  onToggleCollaboration?: () => void;
  onClose?: () => void;
  onBroadcastChanges?: (changes: WhiteboardChanges) => void;
  onGetSnapshot?: (snapshot: any) => void;
  onTakeSnapshot?: (snapshot: WhiteboardSnapshotItem) => void;
  participantName?: string;
  participantRole?: 'parent' | 'teacher' | 'child';
  remoteChanges?: WhiteboardChanges | null;
  remoteSnapshot?: any;
  theme: 'light' | 'dark';
}

export default function SessionWhiteboard({
  isTeacher,
  allowCollaboration,
  onToggleCollaboration,
  onClose,
  onBroadcastChanges,
  onGetSnapshot,
  onTakeSnapshot,
  remoteChanges,
  remoteSnapshot,
  theme,
  participantName,
  participantRole,
}: SessionWhiteboardProps) {
  const editorRef = useRef<Editor | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Match dark / light theme
      editor.user.updateUserPreferences({ colorScheme: theme === 'dark' ? 'dark' : 'light' });

      // Apply initial readonly state based on role and collaboration setting
      const isReadonly = !isTeacher && !allowCollaboration;
      editor.updateInstanceState({ isReadonly });

      // If there's an initial remote snapshot (e.g. from teacher), load it
      if (remoteSnapshot) {
        try {
          editor.loadSnapshot(remoteSnapshot);
        } catch {
          // ignore snapshot load error
        }
      }

      if (isTeacher && onGetSnapshot) {
        onGetSnapshot(editor.getSnapshot());
      }
    },
    [theme, isTeacher, allowCollaboration, remoteSnapshot, onGetSnapshot],
  );

  // Keep dark/light mode in sync
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.user.updateUserPreferences({ colorScheme: theme === 'dark' ? 'dark' : 'light' });
    }
  }, [theme]);

  // Keep readonly state in sync with teacher collaboration toggle
  useEffect(() => {
    if (editorRef.current) {
      const isReadonly = !isTeacher && !allowCollaboration;
      editorRef.current.updateInstanceState({ isReadonly });
    }
  }, [isTeacher, allowCollaboration]);

  // Listen to local user changes and broadcast to peers
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !onBroadcastChanges) return;

    const cleanup = editor.store.listen(
      (entry) => {
        if (entry.source !== 'user') return;
        const changes: WhiteboardChanges = {
          added: Object.values(entry.changes.added),
          updated: Object.values(entry.changes.updated).map(([, to]) => to),
          removed: Object.keys(entry.changes.removed),
        };
        if (changes.added.length || changes.updated.length || changes.removed.length) {
          onBroadcastChanges(changes);
        }
      },
      { scope: 'document', source: 'user' },
    );

    return () => cleanup();
  }, [onBroadcastChanges]);

  // Merge incoming remote changes from LiveKit data channel
  useEffect(() => {
    if (!remoteChanges || !editorRef.current) return;
    const editor = editorRef.current;
    editor.store.mergeRemoteChanges(() => {
      if (remoteChanges.added?.length) {
        editor.store.put(remoteChanges.added);
      }
      if (remoteChanges.updated?.length) {
        editor.store.put(remoteChanges.updated);
      }
      if (remoteChanges.removed?.length) {
        editor.store.remove(remoteChanges.removed as any);
      }
    });
  }, [remoteChanges]);

  // Clear board (teacher action)
  const handleClearBoard = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const ids = editor.getCurrentPageShapeIds();
    if (ids.size > 0) {
      editor.deleteShapes(Array.from(ids));
    }
  }, []);

  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);

  // Take timestamped snapshot of whiteboard
  const handleTakeSnapshot = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;

    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      toast.error('Whiteboard is empty. Draw something first!');
      return;
    }

    setIsTakingSnapshot(true);
    try {
      const svgResult = await editor.getSvgString(shapeIds);
      const svgString = typeof svgResult === 'string' ? svgResult : (svgResult as any)?.svg || '';
      if (!svgString) {
        toast.error('Could not capture whiteboard image');
        return;
      }
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const snapshotItem: WhiteboardSnapshotItem = {
        id: `wb-snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: `Board Snapshot (${formattedTime})`,
        svg: svgString,
        timestamp: formattedTime,
        authorName: participantName || (isTeacher ? 'Tutor' : 'Participant'),
        authorRole: participantRole || (isTeacher ? 'teacher' : 'parent'),
        createdAt: now.toISOString(),
      };

      onTakeSnapshot?.(snapshotItem);
      toast.success(`Whiteboard snapshot captured at ${formattedTime}!`);
    } catch (err: any) {
      toast.error(`Snapshot failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsTakingSnapshot(false);
    }
  }, [participantName, participantRole, isTeacher, onTakeSnapshot]);

  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <div className={`h-full w-full flex items-center justify-center ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white text-gray-500'}`}>
        <Sparkles size={20} className="animate-spin mr-2" />
        <span className="text-xs font-semibold">Loading whiteboard…</span>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full flex flex-col overflow-hidden rounded-2xl border ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Top Controls & Status Bar */}
      <div className={`shrink-0 flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-md z-30 transition-colors ${isDark ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/95 border-gray-100 text-gray-900'}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#001A72] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            W
          </div>
          <span className="text-xs font-bold tracking-tight">Whiteboard</span>

          {/* Student view status */}
          {!isTeacher && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${allowCollaboration ? (isDark ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDark ? 'bg-amber-950/40 border-amber-500/40 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>
              {allowCollaboration ? <Unlock size={11} /> : <Lock size={11} />}
              <span>{allowCollaboration ? 'Collaborative (You can draw)' : 'View-only (Teacher presenting)'}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Snapshot Button for anyone */}
          <button
            onClick={handleTakeSnapshot}
            disabled={isTakingSnapshot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                : 'bg-[#001A72] hover:bg-[#001A72]/90 text-white disabled:opacity-50'
            }`}
            title="Take a timestamped snapshot of the current whiteboard"
          >
            {isTakingSnapshot ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            <span>{isTakingSnapshot ? 'Saving...' : 'Take Snapshot'}</span>
          </button>

          {/* Teacher Controls */}
          {isTeacher && (
            <>
              {/* Collaboration Permission Toggle */}
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

              {/* Clear Board */}
              <button
                onClick={handleClearBoard}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                title="Clear all whiteboard content"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>

              {/* Close Whiteboard */}
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
      <div className="flex-1 min-h-0 w-full relative">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}
