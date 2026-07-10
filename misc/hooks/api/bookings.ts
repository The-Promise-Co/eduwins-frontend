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

export const useBooking = (bookingId: string | undefined) => {
  return useQuery<Booking>({
    queryKey: ['bookings', bookingId],
    queryFn: async () => {
      const response = await api.get<Booking>(`/bookings/${bookingId}`);
      return response.data;
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

export const useDenyBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<{ booking: Booking }, unknown, string>({
    mutationFn: async (bookingId) => {
      const response = await api.patch<{ booking: Booking }>(`/bookings/${bookingId}/deny`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'requests'] }),
  });
};
