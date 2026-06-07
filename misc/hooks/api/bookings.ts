import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { Booking } from '@/misc/types';

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
