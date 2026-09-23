'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  LayoutContextProvider,
  useCreateLayoutContext,
  useTracks,
  ParticipantTile,
  RoomAudioRenderer,
  useChat,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track, type RemoteParticipant } from 'livekit-client';
import api from '@/misc/services/api';
import { useSessionUi } from '@/misc/context/SessionUiContext';
import Whiteboard from './whiteboard/Whiteboard';
import { WB, type WhiteboardSnapshotData } from './whiteboard/types';
import { clearSessionState } from './whiteboard/sessionStore';
import SessionNotesSidebar from './SessionNotesSidebar';
import { NoteItem } from '@/misc/types/session';
import {
  useSessionNotes,
  useSavePersonalNotes,
  useSaveSharedNotes,
  useSaveWhiteboardSnapshot,
} from '@/misc/hooks/api/notes';
import '@livekit/components-styles';
import {
  Camera,
  CameraOff,
  FileText,
  Hand,
  HelpCircle,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Minimize,
  Monitor,
  MonitorOff,
  Moon,
  MoreHorizontal,
  PenTool,
  PhoneOff,
  Send,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveKitSessionProps {
  serverUrl: string;
  token: string;
  bookingId: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'child';
  childId?: string;
  teacherName?: string;
  parentName?: string;
  initialCameraEnabled?: boolean;
  initialMicEnabled?: boolean;
  onDisconnected?: () => void;
}

interface ParticipantProfile {
  name: string;
  role?: 'parent' | 'teacher' | 'child';
}

// Suppress LiveKit's built-in name/metadata overlay — we render our own pills
const HIDE_LK_META = `
  .lk-participant-metadata { display: none !important; }
  .screen-share-tile video { object-fit: contain !important; }
`;

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-2 lg:grid-cols-4';
}

// ─── Participant Stage ────────────────────────────────────────────────────────

interface ParticipantStageProps {
  bookingId: string;
  raisedHands: Record<string, boolean>;
  getDisplayName: (p: { identity: string; name?: string; isLocal?: boolean }) => string;
  theme: 'light' | 'dark';
  isTeacher: boolean;
  whiteboardActive: boolean;
  allowCollaboration: boolean;
  onToggleCollaboration: () => void;
  onCloseWhiteboard: () => void;
  onTakeSnapshot?: (snapshot: WhiteboardSnapshotData) => void;
  participantName?: string;
  participantRole?: 'parent' | 'teacher' | 'child';
}

function ParticipantStage({
  bookingId,
  raisedHands,
  getDisplayName,
  theme,
  isTeacher,
  whiteboardActive,
  allowCollaboration,
  onToggleCollaboration,
  onCloseWhiteboard,
  onTakeSnapshot,
  participantName,
  participantRole,
}: ParticipantStageProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const screenShareTrack = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t !== screenShareTrack);

  // Active presentation focus when both Whiteboard and Screen Share are running
  const [activePresentation, setActivePresentation] = useState<'whiteboard' | 'screenshare'>('whiteboard');

  useEffect(() => {
    if (whiteboardActive && !screenShareTrack) {
      setActivePresentation('whiteboard');
    } else if (screenShareTrack && !whiteboardActive) {
      setActivePresentation('screenshare');
    }
  }, [whiteboardActive, screenShareTrack]);

  const isDark = theme === 'dark';

  if (tracks.length === 0 && !whiteboardActive) {
    return (
      <div className={`flex-1 min-h-0 flex items-center justify-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Waiting for participants…
      </div>
    );
  }

  // ── CASE 1: BOTH Whiteboard and Screen Share are active (Option 1 Tabbed Focus) ──
  if (whiteboardActive && screenShareTrack) {
    const screenOwner = getDisplayName(screenShareTrack.participant);

    return (
      <div className="flex-1 min-h-0 p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <style>{HIDE_LK_META}</style>

        {/* Main Stage: Focused Presentation with Tab Switcher */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col gap-2 overflow-hidden">
          {/* Top Switcher Bar */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-sm">
              <button
                onClick={() => setActivePresentation('whiteboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePresentation === 'whiteboard'
                    ? 'bg-[#001A72] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <PenTool size={13} />
                <span>Whiteboard</span>
              </button>
              <button
                onClick={() => setActivePresentation('screenshare')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activePresentation === 'screenshare'
                    ? 'bg-[#001A72] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Monitor size={13} />
                <span>Screen Share</span>
              </button>
            </div>
          </div>

          {/* Main content display */}
          <div className="flex-1 min-h-0 min-w-0 relative rounded-2xl overflow-hidden">
            {activePresentation === 'whiteboard' ? (
              <Whiteboard
                bookingId={bookingId}
                isTeacher={isTeacher}
                allowCollaboration={allowCollaboration}
                onToggleCollaboration={onToggleCollaboration}
                onClose={onCloseWhiteboard}
                onTakeSnapshot={onTakeSnapshot}
                participantName={participantName}
                participantRole={participantRole}
                theme={theme}
              />
            ) : (
              <div className={`h-full w-full relative rounded-2xl border bg-black overflow-hidden flex items-center justify-center screen-share-tile ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <ParticipantTile trackRef={screenShareTrack} className="h-full w-full object-contain" />
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/65 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                  <Monitor size={13} className="text-blue-400" />
                  <span className="text-[11px] font-semibold text-white leading-none">
                    {screenOwner}&apos;s screen
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Inactive Presentation Thumbnail + Camera Tiles */}
        <div className="w-full md:w-[200px] shrink-0 flex md:flex-col flex-row gap-3 overflow-x-auto md:overflow-y-auto pr-0.5">
          {/* Preview card of the inactive presentation */}
          {activePresentation === 'whiteboard' ? (
            <div
              onClick={() => setActivePresentation('screenshare')}
              className={`relative rounded-xl border bg-black overflow-hidden aspect-video shrink-0 w-44 md:w-full cursor-pointer group hover:ring-2 hover:ring-blue-500 transition ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              title="Click to view Screen Share"
            >
              <ParticipantTile trackRef={screenShareTrack} className="h-full w-full object-contain pointer-events-none" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-end p-1.5">
                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] font-bold text-white">
                  <Monitor size={10} className="text-blue-400" />
                  <span>View Screen</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setActivePresentation('whiteboard')}
              className={`relative rounded-xl border bg-gray-900 overflow-hidden aspect-video shrink-0 w-44 md:w-full cursor-pointer group hover:ring-2 hover:ring-blue-500 transition flex flex-col items-center justify-center gap-1 p-2 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              title="Click to view Whiteboard"
            >
              <div className="w-8 h-8 rounded-lg bg-[#001A72] text-white flex items-center justify-center">
                <PenTool size={16} />
              </div>
              <span className="text-[10px] font-bold text-white">View Whiteboard</span>
            </div>
          )}

          {/* Participant Camera Feeds */}
          {cameraTracks.map((track) => {
            const handRaised = raisedHands[track.participant.identity] ?? false;
            const micOff = !track.participant.isMicrophoneEnabled;
            const displayName = getDisplayName(track.participant);
            return (
              <div
                key={`${track.participant.identity}-${track.source}`}
                className={`relative rounded-xl border bg-gray-900 overflow-hidden aspect-video shrink-0 w-44 md:w-full ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              >
                <ParticipantTile trackRef={track} className="h-full w-full" />
                <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 max-w-[88%]">
                  {micOff && <MicOff size={9} className="text-white/70 shrink-0" />}
                  <span className="text-[10px] font-semibold text-white leading-none truncate">
                    {displayName}
                  </span>
                </div>
                {handRaised && (
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 bg-amber-500 rounded-full px-1.5 py-0.5">
                    <Hand size={9} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── CASE 2: ONLY Whiteboard is active ──
  if (whiteboardActive) {
    return (
      <div className="flex-1 min-h-0 p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <style>{HIDE_LK_META}</style>

        {/* Main Stage: Whiteboard */}
        <div className="flex-1 min-h-0 min-w-0 relative rounded-2xl overflow-hidden">
          <Whiteboard
            bookingId={bookingId}
            isTeacher={isTeacher}
            allowCollaboration={allowCollaboration}
            onToggleCollaboration={onToggleCollaboration}
            onClose={onCloseWhiteboard}
            onTakeSnapshot={onTakeSnapshot}
            participantName={participantName}
            participantRole={participantRole}
            theme={theme}
          />
        </div>

        {/* Right Sidebar: Participant Camera Tiles */}
        <div className="w-full md:w-[200px] shrink-0 flex md:flex-col flex-row gap-3 overflow-x-auto md:overflow-y-auto pr-0.5">
          {cameraTracks.map((track) => {
            const handRaised = raisedHands[track.participant.identity] ?? false;
            const micOff = !track.participant.isMicrophoneEnabled;
            const displayName = getDisplayName(track.participant);
            return (
              <div
                key={`${track.participant.identity}-${track.source}`}
                className={`relative rounded-xl border bg-gray-900 overflow-hidden aspect-video shrink-0 w-44 md:w-full ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              >
                <ParticipantTile trackRef={track} className="h-full w-full" />
                <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 max-w-[88%]">
                  {micOff && <MicOff size={9} className="text-white/70 shrink-0" />}
                  <span className="text-[10px] font-semibold text-white leading-none truncate">
                    {displayName}
                  </span>
                </div>
                {handRaised && (
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 bg-amber-500 rounded-full px-1.5 py-0.5">
                    <Hand size={9} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── CASE 3: ONLY Screen Sharing is active ──
  if (screenShareTrack) {
    const screenOwner = getDisplayName(screenShareTrack.participant);

    return (
      <div className="flex-1 min-h-0 p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <style>{HIDE_LK_META}</style>

        {/* Main: Screen share tile */}
        <div className={`flex-1 min-h-0 min-w-0 relative rounded-2xl border bg-black overflow-hidden flex items-center justify-center screen-share-tile ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <ParticipantTile trackRef={screenShareTrack} className="h-full w-full object-contain" />
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/65 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
            <Monitor size={13} className="text-blue-400" />
            <span className="text-[11px] font-semibold text-white leading-none">
              {screenOwner}&apos;s screen
            </span>
          </div>
        </div>

        {/* Participants strip on the right: ~200px width, scrollable if necessary */}
        <div className="w-full md:w-[200px] shrink-0 flex md:flex-col flex-row gap-3 overflow-x-auto md:overflow-y-auto pr-0.5">
          {cameraTracks.map((track) => {
            const handRaised = raisedHands[track.participant.identity] ?? false;
            const micOff = !track.participant.isMicrophoneEnabled;
            const displayName = getDisplayName(track.participant);
            return (
              <div
                key={`${track.participant.identity}-${track.source}`}
                className={`relative rounded-xl border bg-gray-900 overflow-hidden aspect-video shrink-0 w-44 md:w-full ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
              >
                <ParticipantTile trackRef={track} className="h-full w-full" />
                <div className="absolute bottom-1.5 left-1.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 max-w-[88%]">
                  {micOff && <MicOff size={9} className="text-white/70 shrink-0" />}
                  <span className="text-[10px] font-semibold text-white leading-none truncate">
                    {displayName}
                  </span>
                </div>
                {handRaised && (
                  <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 bg-amber-500 rounded-full px-1.5 py-0.5">
                    <Hand size={9} className="text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── CASE 4: Single participant (no screen share, no whiteboard): stretch to fill ──
  if (tracks.length === 1) {
    const track = tracks[0];
    const handRaised = raisedHands[track.participant.identity] ?? false;
    const micOff = !track.participant.isMicrophoneEnabled;
    const displayName = getDisplayName(track.participant);
    return (
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        <style>{HIDE_LK_META}</style>
        <div className={`relative flex-1 min-h-0 rounded-2xl border bg-gray-900 overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <ParticipantTile trackRef={track} className="h-full w-full" />
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
            {micOff && <MicOff size={11} className="text-white/70" />}
            <span className="text-[11px] font-semibold text-white leading-none">{displayName}</span>
          </div>
          {handRaised && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-amber-500 rounded-full px-3 py-1.5">
              <Hand size={13} className="text-white" />
              <span className="text-[11px] font-semibold text-white">Hand raised</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CASE 5: Multiple participants (no screen share, no whiteboard): responsive grid ──
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <style>{HIDE_LK_META}</style>
      <div className={`grid gap-4 ${getGridCols(tracks.length)}`}>
        {tracks.map((track) => {
          const handRaised = raisedHands[track.participant.identity] ?? false;
          const micOff = !track.participant.isMicrophoneEnabled;
          const displayName = getDisplayName(track.participant);
          return (
            <div
              key={`${track.participant.identity}-${track.source}`}
              className={`relative rounded-2xl border bg-gray-900 overflow-hidden aspect-video ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            >
              <ParticipantTile trackRef={track} className="h-full w-full" />
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                {micOff && <MicOff size={10} className="text-white/70" />}
                <span className="text-[11px] font-semibold text-white leading-none">{displayName}</span>
              </div>
              {handRaised && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-amber-500 rounded-full px-2 py-1">
                  <Hand size={12} className="text-white" />
                  <span className="text-[10px] font-semibold text-white">Raised</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chat Sidebar ─────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  chatMessages: ReturnType<typeof useChat>['chatMessages'];
  send: ReturnType<typeof useChat>['send'];
  getDisplayName: (p: { identity: string; name?: string; isLocal?: boolean }) => string;
  theme: 'light' | 'dark';
  onClose: () => void;
}

function ChatSidebar({ chatMessages, send, getDisplayName, theme, onClose }: ChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;
    setIsSending(true);
    try {
      await send(text);
      setInputValue('');
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, send]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const formatTs = (ts: number) =>
    new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

  const isDark = theme === 'dark';

  return (
    <aside className={`w-80 shrink-0 border-r flex flex-col overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Chat</span>
        <button
          onClick={onClose}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
          aria-label="Close chat"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {chatMessages.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-full gap-2 pt-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            <MessageSquare size={28} />
            <p className="text-xs">No messages yet</p>
          </div>
        )}
        {chatMessages.map((msg) => {
          const displayName = msg.from ? getDisplayName(msg.from) : 'Unknown';
          const initial = displayName[0]?.toUpperCase() ?? '?';
          return (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#001A72] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <span className="text-[10px] font-bold text-white">{initial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className={`text-xs font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{displayName}</span>
                  <span className={`text-[10px] shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatTs(msg.timestamp)}</span>
                </div>
                <p className={`text-xs break-words leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className={`shrink-0 border-t p-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className={`flex-1 bg-transparent text-xs outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[#001A72] text-white hover:bg-[#001A72]/85 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            aria-label="Send"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Participants Popup ───────────────────────────────────────────────────────

interface ParticipantsPopupProps {
  teacherName?: string;
  parentName?: string;
  participantRole: 'parent' | 'teacher' | 'child';
  getDisplayName: (p: { identity: string; name?: string; isLocal?: boolean }) => string;
  profiles: Record<string, ParticipantProfile>;
  theme: 'light' | 'dark';
  onClose: () => void;
}

function ParticipantsPopup({
  teacherName,
  parentName,
  participantRole,
  getDisplayName,
  profiles,
  theme,
  onClose,
}: ParticipantsPopupProps) {
  const participants = useParticipants();
  const isDark = theme === 'dark';

  return (
    <div className={`absolute bottom-full left-0 mb-3 w-72 rounded-2xl border overflow-hidden z-50 ${isDark ? 'bg-gray-900 border-gray-800 text-white shadow-2xl' : 'bg-white border-gray-200 text-gray-900 shadow-xl'}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <span className="text-sm font-bold">
          Participants <span className={`font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({participants.length})</span>
        </span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
        >
          <X size={13} />
        </button>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto space-y-1">
        {participants.map((p) => {
          const displayName = getDisplayName(p);
          const initial = displayName[0]?.toUpperCase() ?? '?';

          const profile = profiles[p.identity];
          const role = p.isLocal
            ? participantRole
            : profile?.role ||
              (teacherName && (displayName === teacherName || p.identity === teacherName)
                ? 'teacher'
                : parentName && (displayName === parentName || p.identity === parentName)
                ? 'parent'
                : participantRole === 'parent' && teacherName
                ? 'teacher'
                : undefined);

          const isTutor = role === 'teacher' || (teacherName && displayName === teacherName);

          return (
            <div
              key={p.identity}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition ${
                isTutor
                  ? isDark
                    ? 'bg-blue-950/40 border-2 border-blue-500/60'
                    : 'bg-[#001A72]/5 border-2 border-[#001A72]'
                  : isDark
                  ? 'hover:bg-gray-800/80 border border-transparent'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isTutor ? 'bg-[#001A72]' : isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              >
                <span className={`text-[11px] font-bold ${isTutor ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {initial}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{displayName}</p>
                  {isTutor && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#001A72] text-white shrink-0">
                      Tutor
                    </span>
                  )}
                </div>
                {!isTutor && role && (
                  <p className={`text-[10px] capitalize font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{role}</p>
                )}
              </div>
              {!p.isMicrophoneEnabled && (
                <MicOff size={13} className={`shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── More Menu Popup ──────────────────────────────────────────────────────────

interface MoreMenuPopupProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

function MoreMenuPopup({
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  onClose,
}: MoreMenuPopupProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`absolute bottom-full left-0 mb-3 w-64 rounded-2xl border overflow-hidden z-50 ${isDark ? 'bg-gray-900 border-gray-800 text-white shadow-2xl' : 'bg-white border-gray-200 text-gray-900 shadow-xl'}`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <span className="text-sm font-bold">More options</span>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {/* Option: Toggle Theme */}
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Theme</p>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </p>
            </div>
          </div>

          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Option: Toggle Fullscreen */}
        <button
          onClick={() => {
            onToggleFullscreen();
            onClose();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-[#001A72]'}`}>
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </div>
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {isFullscreen ? 'Restore header and sidebar' : 'Hide header and sidebar'}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Three-group toolbar ──────────────────────────────────────────────────────

interface SessionToolbarProps {
  showChat: boolean;
  onToggleChat: () => void;
  unreadCount: number;
  showNotes: boolean;
  onToggleNotes: () => void;
  hasUnreadNotes: boolean;
  myHandRaised: boolean;
  onToggleHandRaise: () => void;
  teacherName?: string;
  parentName?: string;
  participantRole: 'parent' | 'teacher' | 'child';
  getDisplayName: (p: { identity: string; name?: string; isLocal?: boolean }) => string;
  profiles: Record<string, ParticipantProfile>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isTeacher: boolean;
  whiteboardActive: boolean;
  onToggleWhiteboard: () => void;
}

function SessionToolbar({
  showChat,
  onToggleChat,
  unreadCount,
  showNotes,
  onToggleNotes,
  hasUnreadNotes,
  myHandRaised,
  onToggleHandRaise,
  teacherName,
  parentName,
  participantRole,
  getDisplayName,
  profiles,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  isTeacher,
  whiteboardActive,
  onToggleWhiteboard,
}: SessionToolbarProps) {
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const toggleCamera = useCallback(() => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
  }, [localParticipant, isCameraEnabled]);

  const toggleMic = useCallback(() => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleScreenShare = useCallback(() => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  }, [localParticipant, isScreenShareEnabled]);

  const handleLeave = useCallback(() => {
    room.disconnect();
  }, [room]);

  const isDark = theme === 'dark';

  const panelBtn = (active: boolean) =>
    `relative w-11 h-11 rounded-full flex items-center justify-center transition ${
      active
        ? isDark
          ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40'
          : 'bg-[#001A72]/10 text-[#001A72] hover:bg-[#001A72]/15'
        : isDark
        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
    }`;

  const mediaBtn = (enabled: boolean) =>
    `w-11 h-11 rounded-full flex items-center justify-center transition ${
      enabled
        ? isDark
          ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        : 'bg-red-500 text-white hover:bg-red-600'
    }`;

  return (
    <div className={`shrink-0 border-t px-4 py-3 transition-colors ${
      isDark
        ? 'bg-gray-900 border-gray-800'
        : 'bg-white border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]'
    }`}>
      <div className="flex items-center justify-between">
        {/* ── Left: panel toggles ── */}
        <div className="flex items-center gap-2">
          {/* Chat */}
          <button
            onClick={() => {
              onToggleChat();
              setShowParticipants(false);
              setShowMoreMenu(false);
            }}
            className={panelBtn(showChat)}
            aria-label="Chat"
            title="Chat"
          >
            <MessageSquare size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Session Notes */}
          <button
            onClick={() => {
              onToggleNotes();
              setShowParticipants(false);
              setShowMoreMenu(false);
            }}
            className={panelBtn(showNotes)}
            aria-label="Session Notes"
            title="Session Notes (Shared & Personal)"
          >
            <FileText size={18} />
            {hasUnreadNotes && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900" />
            )}
          </button>

          {/* Participants */}
          <div className="relative">
            <button
              onClick={() => {
                setShowParticipants((v) => !v);
                setShowMoreMenu(false);
              }}
              className={panelBtn(showParticipants)}
              aria-label="Participants"
              title="Participants"
            >
              <Users size={18} />
            </button>
            {showParticipants && (
              <ParticipantsPopup
                teacherName={teacherName}
                parentName={parentName}
                participantRole={participantRole}
                getDisplayName={getDisplayName}
                profiles={profiles}
                theme={theme}
                onClose={() => setShowParticipants(false)}
              />
            )}
          </div>

          {/* More options popup */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMoreMenu((v) => !v);
                setShowParticipants(false);
              }}
              className={panelBtn(showMoreMenu)}
              aria-label="More options"
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMoreMenu && (
              <MoreMenuPopup
                theme={theme}
                onToggleTheme={onToggleTheme}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
                onClose={() => setShowMoreMenu(false)}
              />
            )}
          </div>
        </div>

        {/* ── Center: media controls ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className={mediaBtn(isCameraEnabled)}
            aria-label={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            title={isCameraEnabled ? 'Camera on' : 'Camera off'}
          >
            {isCameraEnabled ? <Camera size={18} /> : <CameraOff size={18} />}
          </button>
          <button
            onClick={toggleMic}
            className={mediaBtn(isMicrophoneEnabled)}
            aria-label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
            title={isMicrophoneEnabled ? 'Mic on' : 'Mic off'}
          >
            {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
          <button
            onClick={toggleScreenShare}
            className={mediaBtn(isScreenShareEnabled)}
            aria-label={isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}
            title={isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenShareEnabled ? <MonitorOff size={18} /> : <Monitor size={18} />}
          </button>

          {/* Teacher Whiteboard button */}
          {isTeacher ? (
            <button
              onClick={onToggleWhiteboard}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                whiteboardActive
                  ? 'bg-[#001A72] text-white shadow-sm'
                  : isDark
                  ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={whiteboardActive ? 'Close whiteboard' : 'Open whiteboard'}
              title={whiteboardActive ? 'Close whiteboard' : 'Open whiteboard'}
            >
              <PenTool size={18} />
            </button>
          ) : whiteboardActive ? (
            <div
              className="px-3 py-1.5 rounded-full bg-[#001A72]/15 text-[#001A72] dark:text-blue-400 text-xs font-bold flex items-center gap-1.5"
              title="Whiteboard in session"
            >
              <PenTool size={14} />
              <span>Whiteboard</span>
            </div>
          ) : null}

          <button
            onClick={onToggleHandRaise}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
              myHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : isDark
                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-label={myHandRaised ? 'Lower hand' : 'Raise hand'}
            title={myHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand size={18} />
          </button>
        </div>

        {/* ── Right: secondary actions ── */}
        <div className="flex items-center gap-2">
          <button className={panelBtn(false)} aria-label="Help" title="Help">
            <HelpCircle size={18} />
          </button>
          <button
            onClick={handleLeave}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition shadow-sm"
            aria-label="Leave session"
            title="Leave session"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room Content ─────────────────────────────────────────────────────────────

interface RoomContentProps {
  bookingId: string;
  teacherName?: string;
  parentName?: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'child';
}

function RoomContent({
  bookingId,
  teacherName,
  parentName,
  participantName,
  participantRole,
}: RoomContentProps) {
  const room = useRoomContext();
  const { theme, toggleTheme, isFullscreen, toggleFullscreen } = useSessionUi();

  const isTeacher = participantRole === 'teacher';

  // Session Notes state & persistence
  const notesQuery = useSessionNotes(bookingId);
  const savePersonalNotes = useSavePersonalNotes(bookingId);
  const saveSharedNotes = useSaveSharedNotes(bookingId);
  const saveWhiteboardSnapshot = useSaveWhiteboardSnapshot(bookingId);

  const [personalNotes, setPersonalNotes] = useState<NoteItem[]>([]);
  const [sharedNotes, setSharedNotes] = useState<NoteItem[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [hasUnreadNotes, setHasUnreadNotes] = useState(false);

  // Remount = full reload from the DB (source of truth). Reset locals, then
  // refetch the whole session so late-arriving saves are never missed.
  useEffect(() => {
    setPersonalNotes([]);
    setSharedNotes([]);
    void notesQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // DB truth wins: unconditionally replace locals on every fresh payload so a
  // remount loads all notes (including an empty list after deletes).
  useEffect(() => {
    if (!notesQuery.data) return;
    setPersonalNotes(notesQuery.data.personalNotes ?? []);
    setSharedNotes(notesQuery.data.sharedNotes ?? []);
  }, [notesQuery.data]);

  useEffect(() => {
    if (notesQuery.isError) {
      toast.error('Notes not loaded.', {
        action: { label: 'Retry', onClick: () => void notesQuery.refetch() },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesQuery.isError]);

  // Broadcast shared notes over LiveKit data channel (only after DB confirms)
  const handleBroadcastSharedNotes = useCallback(
    (notes: NoteItem[]) => {
      setSharedNotes(notes);
      if (!room?.localParticipant) return;
      try {
        const encoder = new TextEncoder();
        void room.localParticipant.publishData(
          encoder.encode(
            JSON.stringify({
              type: 'shared-notes-collection-update',
              notes,
              sender: participantName,
            }),
          ),
          { reliable: true },
        );
      } catch {
        // best-effort
      }
    },
    [participantName, room],
  );

  // Whiteboard manual snapshot capture handler. The database is the source
  // of truth: peers are only notified after the server confirms (201), and a
  // failed save stays in the pending outbox with a retry action — never a
  // silent success.
  const handleTakeWhiteboardSnapshot = useCallback(
    (snapshot: WhiteboardSnapshotData) => {
      const attempt = (): Promise<void> =>
        saveWhiteboardSnapshot.mutateAsync(snapshot).then(
          () => {
            if (!room?.localParticipant) return;
            try {
              const encoder = new TextEncoder();
              void room.localParticipant.publishData(
                encoder.encode(
                  JSON.stringify({
                    type: WB.SNAPSHOT_SAVED,
                    snapshot,
                    sender: participantName,
                  }),
                ),
                { reliable: true },
              );
            } catch {
              // best-effort
            }
          },
          () => {
            toast.error('Snapshot kept on this device — server save failed.', {
              action: { label: 'Retry', onClick: () => void attempt() },
            });
          },
        );
      void attempt();
    },
    [participantName, room, saveWhiteboardSnapshot],
  );

  // Whiteboard states (drawing sync itself lives in the Whiteboard component —
  // Yjs doc + LiveKit data channels; only open/close/collab flags are managed here)
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [allowCollaboration, setAllowCollaboration] = useState(false);

  // Profiles and custom names mapped by participant identity
  const [profiles, setProfiles] = useState<Record<string, ParticipantProfile>>({});

  // Dynamic name resolution for participant pills, chat, and popup
  const getDisplayName = useCallback(
    (p: { identity: string; name?: string; isLocal?: boolean }) => {
      if (p.isLocal) {
        return participantName || p.name || p.identity;
      }
      if (profiles[p.identity]?.name) {
        return profiles[p.identity].name;
      }
      if (p.name && p.name.trim() !== '' && p.name !== p.identity) {
        return p.name;
      }
      if (
        teacherName &&
        (p.identity === teacherName ||
          p.identity.toLowerCase().includes('teacher') ||
          p.identity.toLowerCase().includes('tutor'))
      ) {
        return teacherName;
      }
      if (
        parentName &&
        (p.identity === parentName ||
          p.identity.toLowerCase().includes('parent'))
      ) {
        return parentName;
      }
      if (participantRole === 'parent' && teacherName) {
        return teacherName;
      }
      if (participantRole === 'teacher' && parentName) {
        return parentName;
      }
      return p.name || p.identity || 'Participant';
    },
    [participantName, participantRole, teacherName, parentName, profiles],
  );

  const { chatMessages, send } = useChat();
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevChatLengthRef = useRef(0);

  useEffect(() => {
    const newCount = chatMessages.length - prevChatLengthRef.current;
    if (newCount > 0) {
      if (!showChat) setUnreadCount((c) => c + newCount);
      prevChatLengthRef.current = chatMessages.length;
    }
  }, [chatMessages, showChat]);

  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const [myHandRaised, setMyHandRaised] = useState(false);

  // Broadcast own profile to all participants
  const broadcastProfile = useCallback(() => {
    if (!room?.localParticipant || room.state !== ConnectionState.Connected) return;
    try {
      const encoder = new TextEncoder();
      void room.localParticipant.publishData(
        encoder.encode(
          JSON.stringify({
            type: 'profile',
            name: participantName,
            role: participantRole,
          }),
        ),
        { reliable: true },
      ).catch(() => {
        // The room may close between the state check and publish.
      });
    } catch {
      // best-effort
    }
  }, [participantName, participantRole, room]);

  // Data channel handling (profiles, hand raise, notes, and whiteboard sync)
  useEffect(() => {
    const syncProfile = () => {
      if (!participantName || !room.localParticipant || room.state !== ConnectionState.Connected) return;
      try {
        void room.localParticipant.setName(participantName).catch(() => {
          // The room may close while the metadata update is in flight.
        });
      } catch {
        // ignore
      }
      broadcastProfile();
    };

    if (room.state === ConnectionState.Connected) syncProfile();

    const decoder = new TextDecoder();
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const data = JSON.parse(decoder.decode(payload)) as any;
        if (data.type === 'hand-raise' && participant) {
          setRaisedHands((prev) => ({ ...prev, [participant.identity]: !!data.raised }));
        } else if (data.type === 'profile' && participant) {
          if (data.name) {
            setProfiles((prev) => ({
              ...prev,
              [participant.identity]: { name: data.name!, role: data.role },
            }));
          }
        } else if (data.type === 'shared-notes-collection-update' && Array.isArray(data.notes)) {
          // Peer already persisted to the DB before broadcasting, so accept as truth.
          setSharedNotes(data.notes);
          if (!showNotes) {
            setHasUnreadNotes(true);
          }
        } else if (data.type === WB.SNAPSHOT_SAVED && data.snapshot) {
          toast.info(`Whiteboard snapshot captured by ${data.sender || 'peer'}!`);
        } else if (data.type === WB.SESSION_ENDED) {
          // Teacher closed the board or the session ended: drop local board state.
          // (The Whiteboard component destroys its own Yjs doc on unmount.)
          // Also drop the same-device session restore so a future session on
          // this booking never resurrects the old board.
          setWhiteboardActive(false);
          setAllowCollaboration(false);
          clearSessionState(bookingId);
        } else if (data.type === 'shared-notes-update') {
          // Legacy support
          if (typeof data.content === 'string') {
            const legacyItems: NoteItem[] = [{
              id: 's-1',
              title: 'Shared Note',
              content: data.content,
              color: 'blue',
              authorName: data.sender,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }];
            setSharedNotes(legacyItems);
            if (!showNotes) {
              setHasUnreadNotes(true);
            }
          }
        } else if (data.type === WB.STATE) {
          setWhiteboardActive(!!data.active);
          setAllowCollaboration(!!data.allowCollaboration);
        }
      } catch {
        // malformed data — ignore
      }
    };

    const handleParticipantConnected = () => {
      broadcastProfile();
      if (isTeacher && whiteboardActive) {
        // Late joiners fetch the board themselves via the Yjs state-vector
        // handshake; we only need to advertise that the board is open.
        const encoder = new TextEncoder();
        void room.localParticipant.publishData(
          encoder.encode(
            JSON.stringify({
              type: WB.STATE,
              active: true,
              allowCollaboration,
            }),
          ),
          { reliable: true },
        );
      }
      if (sharedNotes) {
        const encoder = new TextEncoder();
        void room.localParticipant.publishData(
          encoder.encode(
            JSON.stringify({
              type: 'shared-notes-update',
              content: sharedNotes,
              sender: participantName,
            }),
          ),
          { reliable: true },
        );
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.Connected, syncProfile);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.Connected, syncProfile);
    };
  }, [room, participantName, broadcastProfile, isTeacher, whiteboardActive, allowCollaboration, sharedNotes, bookingId, showNotes]);

  // Whiteboard Teacher Actions.
  // Drawing content syncs peer-to-peer via Yjs state-vector handshake inside
  // the Whiteboard component — no snapshot bookkeeping needed here.
  const handleToggleWhiteboard = useCallback(() => {
    const next = !whiteboardActive;
    setWhiteboardActive(next);
    if (!next) {
      setAllowCollaboration(false);
    }
    const encoder = new TextEncoder();
    void room.localParticipant.publishData(
      encoder.encode(
        JSON.stringify({
          type: WB.STATE,
          active: next,
          allowCollaboration: next ? allowCollaboration : false,
        }),
      ),
      { reliable: true },
    );
  }, [whiteboardActive, allowCollaboration, room]);

  const handleToggleCollaboration = useCallback(() => {
    const next = !allowCollaboration;
    setAllowCollaboration(next);
    const encoder = new TextEncoder();
    void room.localParticipant.publishData(
      encoder.encode(
        JSON.stringify({
          type: WB.STATE,
          active: true,
          allowCollaboration: next,
        }),
      ),
      { reliable: true },
    );
  }, [allowCollaboration, room]);

  const handleCloseWhiteboard = useCallback(() => {
    setWhiteboardActive(false);
    setAllowCollaboration(false);
    clearSessionState(bookingId);
    const encoder = new TextEncoder();
    // Tell peers to drop the board (each side destroys its in-memory Yjs doc
    // when the whiteboard unmounts). Only user-created snapshots survive.
    void room.localParticipant.publishData(
      encoder.encode(JSON.stringify({ type: WB.SESSION_ENDED })),
      { reliable: true },
    );
  }, [room, bookingId]);

  // Hand raise toggle
  const handleToggleHandRaise = useCallback(() => {
    const next = !myHandRaised;
    setMyHandRaised(next);
    const encoder = new TextEncoder();
    void room.localParticipant.publishData(
      encoder.encode(JSON.stringify({ type: 'hand-raise', raised: next })),
      { reliable: true },
    );
  }, [myHandRaised, room]);

  const openChat = useCallback(() => {
    setShowChat(true);
    setShowNotes(false);
    setUnreadCount(0);
    prevChatLengthRef.current = chatMessages.length;
  }, [chatMessages.length]);

  const closeChat = useCallback(() => setShowChat(false), []);

  const openNotes = useCallback(() => {
    setShowNotes(true);
    setShowChat(false);
    setHasUnreadNotes(false);
  }, []);

  const closeNotes = useCallback(() => setShowNotes(false), []);

  const allRaisedHands: Record<string, boolean> = {
    ...raisedHands,
    [room.localParticipant.identity]: myHandRaised,
  };

  return (
    <div
      className={`flex h-full min-h-0 transition-colors ${
        theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-100 text-gray-900'
      } ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''}`}
    >
      {/* Session Notes sidebar — left */}
      {showNotes && (
        <SessionNotesSidebar
          key={bookingId}
          personalNotes={personalNotes}
          sharedNotes={sharedNotes}
          onSavePersonalNotes={async (notes) => {
            // Optimistic: keep visible immediately; the sidebar flags + toasts on failure.
            setPersonalNotes(notes);
            try {
              await savePersonalNotes.mutateAsync(notes);
            } catch {
              toast.error('Notes not saved — server save failed.', {
                action: { label: 'Retry', onClick: () => void savePersonalNotes.mutateAsync(notes).catch(() => undefined) },
              });
              throw new Error('personal notes save failed');
            }
          }}
          onSaveSharedNotes={async (notes) => {
            // Optimistic: keep visible immediately; broadcast only after DB confirms.
            setSharedNotes(notes);
            try {
              await saveSharedNotes.mutateAsync(notes);
              handleBroadcastSharedNotes(notes);
            } catch {
              toast.error('Notes not saved — server save failed.', {
                action: { label: 'Retry', onClick: () => void saveSharedNotes.mutateAsync(notes).then(() => handleBroadcastSharedNotes(notes)).catch(() => undefined) },
              });
              throw new Error('shared notes save failed');
            }
          }}
          onBroadcastSharedNotes={handleBroadcastSharedNotes}
          participantRole={participantRole}
          participantName={participantName}
          theme={theme}
          onClose={closeNotes}
        />
      )}

      {/* Chat sidebar — left */}
      {showChat && (
        <ChatSidebar
          chatMessages={chatMessages}
          send={send}
          getDisplayName={getDisplayName}
          theme={theme}
          onClose={closeChat}
        />
      )}

      {/* Main: stage + toolbar */}
      <div className="flex flex-1 flex-col min-w-0">
        <ParticipantStage
          bookingId={bookingId}
          raisedHands={allRaisedHands}
          getDisplayName={getDisplayName}
          theme={theme}
          isTeacher={isTeacher}
          whiteboardActive={whiteboardActive}
          allowCollaboration={allowCollaboration}
          onToggleCollaboration={handleToggleCollaboration}
          onCloseWhiteboard={handleCloseWhiteboard}
          onTakeSnapshot={handleTakeWhiteboardSnapshot}
          participantName={participantName}
          participantRole={participantRole}
        />
        <SessionToolbar
          showChat={showChat}
          onToggleChat={showChat ? closeChat : openChat}
          unreadCount={unreadCount}
          showNotes={showNotes}
          onToggleNotes={showNotes ? closeNotes : openNotes}
          hasUnreadNotes={hasUnreadNotes}
          myHandRaised={myHandRaised}
          onToggleHandRaise={handleToggleHandRaise}
          teacherName={teacherName}
          parentName={parentName}
          participantRole={participantRole}
          getDisplayName={getDisplayName}
          profiles={profiles}
          theme={theme}
          onToggleTheme={toggleTheme}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isTeacher={isTeacher}
          whiteboardActive={whiteboardActive}
          onToggleWhiteboard={handleToggleWhiteboard}
        />
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function LiveKitSession({
  serverUrl,
  token,
  bookingId,
  participantName,
  participantRole,
  childId,
  teacherName,
  parentName,
  initialCameraEnabled,
  initialMicEnabled,
  onDisconnected,
}: LiveKitSessionProps) {
  const layoutContext = useCreateLayoutContext();

  const postEvent = useCallback(
    async (event: 'joined' | 'left') => {
      try {
        await api.post(`/sessions/${bookingId}/events`, {
          participantName,
          participantRole,
          childId,
          event,
        });
      } catch {
        // event tracking is best-effort
      }
    },
    [bookingId, participantName, participantRole, childId],
  );

  const handleConnected = useCallback(() => postEvent('joined'), [postEvent]);

  const handleDisconnected = useCallback(() => {
    postEvent('left');
    onDisconnected?.();
  }, [postEvent, onDisconnected]);

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={initialCameraEnabled ?? true}
      audio={initialMicEnabled ?? true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className="h-full"
    >
      <LayoutContextProvider value={layoutContext}>
        <RoomContent
          bookingId={bookingId}
          teacherName={teacherName}
          parentName={parentName}
          participantName={participantName}
          participantRole={participantRole}
        />
      </LayoutContextProvider>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
