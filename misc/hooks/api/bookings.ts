import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { Booking } from '@/misc/types';

export interface CreateBookingRequestInput {
  teacherId: string;
  bookingFor: 'self' | 'children';
  childIds?: string[];
  scheduledDate: string;
  startTime: string;
  endTime: string;
  subject?: string;
  note?: string;
}

export interface BookingRequestsResponse {
  bookings: Booking[];
}

interface BookingDetailResponse {
  booking?: Booking;
  parent?: Booking['parent'];
  teacher?: Booking['teacher'];
  children?: Booking['children'];
}

export const useBooking = (bookingId: string | undefined) => {
  return useQuery<Booking>({
    queryKey: ['bookings', bookingId],
    queryFn: async () => {
      const response = await api.get<BookingDetailResponse & Booking>(`/bookings/${bookingId}`);
      const payload = response.data;
      const booking = payload.booking ?? payload;
      return {
        ...booking,
        parent: payload.parent ?? booking.parent ?? null,
        teacher: payload.teacher ?? booking.teacher ?? null,
        children: payload.children ?? booking.children ?? [],
      };
    },
    enabled: !!bookingId,
  });
};

export const useCreateBookingRequest = () => {
  return useMutation<{ booking: Booking }, unknown, CreateBookingRequestInput>({
    mutationFn: async (data) => {
      const response = await api.post<{ booking: Booking }>('/bookings/requests', data);
      return response.data;
    },
  });
};

export const useBookingRequests = () => {
  return useQuery<BookingRequestsResponse>({
    queryKey: ['bookings', 'requests'],
    queryFn: async () => {
      const response = await api.get<BookingRequestsResponse>('/bookings/requests');
      return response.data;
    },
  });
};

export const useAcceptBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, string>({
    mutationFn: async (bookingId) => {
      const response = await api.patch<{ booking: Booking }>(`/bookings/${bookingId}/accept`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'requests'] }),
  });
};

export interface DenyBookingRequestInput {
  bookingId: string;
  denialReason?: string;
}

export const useDenyBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, DenyBookingRequestInput>({
    mutationFn: async ({ bookingId, denialReason }) => {
      const response = await api.patch<{ booking: Booking }>(`/bookings/${bookingId}/deny`, {
        denialReason,
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'requests'] }),
  });
};

export interface CancelBookingRequestInput {
  bookingId: string;
  reason?: string;
}

export const useCancelBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, CancelBookingRequestInput>({
    mutationFn: async ({ bookingId, reason }) => {
      const response = await api.patch<{ booking: Booking }>(`/bookings/${bookingId}/cancel`, {
        reason,
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'requests'] }),
  });
};

export const useBlockedSlots = (teacherId: string | undefined, date: string | null) => {
  return useQuery<{ startTime: string; endTime: string }[]>({
    queryKey: ['bookings', 'blocked-slots', teacherId, date],
    queryFn: async () => {
      const response = await api.get('/bookings/blocked-slots', {
        params: { teacherId, date },
      });
      return response.data.blockedSlots;
    },
    enabled: !!teacherId && !!date,
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, string>({
    mutationFn: async (bookingId) => {
      const response = await api.patch<{ booking: Booking }>(`/sessions/${bookingId}/start-session`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

export const useEndSession = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, string>({
    mutationFn: async (bookingId) => {
      const response = await api.patch<{ booking: Booking }>(`/sessions/${bookingId}/end-session`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
};

export interface EscrowBreakdown {
  bookingId: string;
  totalAmount: number;
  tutorAmount: number;
  platformFee: number;
  welfareAmount: number;
}

export const useEscrowBreakdown = (bookingId: string | undefined) => {
  return useQuery<EscrowBreakdown>({
    queryKey: ['bookings', 'escrow-breakdown', bookingId],
    queryFn: async () => {
      const response = await api.get<EscrowBreakdown>(`/bookings/${bookingId}/escrow-breakdown`);
      return response.data;
    },
    enabled: !!bookingId,
  });
};
