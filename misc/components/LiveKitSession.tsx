'use client';

import { useCallback } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
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

export default function LiveKitSession({
  serverUrl,
  token,
  bookingId,
  participantName,
  participantRole,
  childId,
  onDisconnected,
}: LiveKitSessionProps) {
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
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
