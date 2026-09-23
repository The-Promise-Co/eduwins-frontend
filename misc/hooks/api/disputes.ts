import { useMutation } from '@tanstack/react-query';
import api from '@/misc/services/api';

export interface CreatedDispute {
  id: string;
  bookingId: string;
  status: string;
}

/** Raise a session dispute (parent). One open dispute per booking. */
export const useCreateDispute = (bookingId: string | undefined) => {
  return useMutation<CreatedDispute, unknown, { issue: string }>({
    mutationFn: async ({ issue }) => {
      const response = await api.post<CreatedDispute>(`/bookings/${bookingId}/disputes`, { issue });
      return response.data;
    },
  });
};
