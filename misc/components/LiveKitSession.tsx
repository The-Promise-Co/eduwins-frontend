'use client';

import { useCallback } from 'react';
import {
  LiveKitRoom,
  LayoutContextProvider,
  useCreateLayoutContext,
  useMaybeLayoutContext,
  useTracks,
  ParticipantTile,
  ControlBar,
  Chat,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import api from '@/misc/services/api';
import '@livekit/components-styles';

interface LiveKitSessionProps {
  serverUrl: string;
  token: string;
  bookingId: string;
  participantName: string;
  participantRole: 'parent' | 'teacher' | 'child';
  childId?: string;
  onDisconnected?: () => void;
}

function getGridColumns(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2';
  if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
  if (count <= 6) return 'grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-2 lg:grid-cols-4';
}

function ParticipantStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div className={`grid gap-3 ${getGridColumns(tracks.length)}`}>
      {tracks.map((track) => (
        <div
          key={`${track.participant.identity}-${track.source}`}
          className={`relative rounded-2xl border border-white/10 bg-gray-900 overflow-hidden aspect-video ${
            track.source === Track.Source.ScreenShare ? 'col-span-full' : ''
          }`}
        >
          <ParticipantTile trackRef={track} className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}

function RoomContent() {
  const layoutContext = useMaybeLayoutContext();
  const showChat = layoutContext?.widget.state?.showChat ?? false;

  return (
    <div className="flex h-full min-h-0 bg-gray-950">
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <ParticipantStage />
        </div>
        <div className="shrink-0 border-t border-white/10 bg-gray-900">
          <ControlBar
            variation="verbose"
            controls={{
              microphone: true,
              camera: true,
              chat: true,
              screenShare: true,
              leave: true,
              settings: true,
            }}
          />
        </div>
      </div>
      {showChat && (
        <aside className="w-80 shrink-0 border-l border-white/10 bg-gray-900 overflow-hidden">
          <Chat className="h-full" />
        </aside>
      )}
    </div>
  );
}

export default function LiveKitSession({
  serverUrl,
  token,
  bookingId,
  participantName,
  participantRole,
  childId,
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

  const handleConnected = useCallback(() => {
    postEvent('joined');
  }, [postEvent]);

  const handleDisconnected = useCallback(() => {
    postEvent('left');
    onDisconnected?.();
  }, [postEvent, onDisconnected]);

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className="h-full"
    >
      <LayoutContextProvider value={layoutContext}>
        <RoomContent />
      </LayoutContextProvider>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
