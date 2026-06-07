import { useMutation } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { InitializePaymentResponse } from '@/misc/types/paystack';

export const useInitializePaystack = () => {
  return useMutation<InitializePaymentResponse, unknown, { email: string; amount: number; course_id: string }>({
    mutationFn: async (data) => {
      const response = await api.post<InitializePaymentResponse>('/paystack/initialize', data);
      return response.data;
    },
  });
};
