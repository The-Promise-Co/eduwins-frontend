import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { LiveKitConnectionDetails, SessionChildCodesResponse, SessionEvent, JoinSessionByCodeResponse } from '@/misc/types/session';

export const useLiveKitToken = (bookingId: string | undefined) => {
  return useQuery<LiveKitConnectionDetails>({
    queryKey: ['livekit', 'token', bookingId],
    queryFn: async () => {
      const res = await api.post<LiveKitConnectionDetails>('/livekit/token', { booking_id: bookingId });
      return res.data;
    },
    enabled: !!bookingId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const validateJoinCode = async (code: string): Promise<JoinSessionByCodeResponse> => {
  const res = await api.get<JoinSessionByCodeResponse>(`/livekit/join/${code}`);
  return res.data;
};

export const useSessionChildCodes = (bookingId: string | undefined) => {
  return useQuery<SessionChildCodesResponse>({
    queryKey: ['session', 'codes', bookingId],
    queryFn: async () => {
      const res = await api.get<SessionChildCodesResponse>(`/livekit/codes/${bookingId}`);
      return res.data;
    },
    enabled: !!bookingId,
  });
};

export const useSessionEvents = (bookingId: string | undefined) => {
  return useQuery<SessionEvent[]>({
    queryKey: ['session', 'events', bookingId],
    queryFn: async () => {
      const res = await api.get<{ events: SessionEvent[] }>(`/sessions/${bookingId}/events`);
      return res.data.events;
    },
    enabled: !!bookingId,
    refetchInterval: 10000,
  });
};
