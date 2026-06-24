import { useMutation } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { InitializeCoursePaymentPayload, InitializePaymentResponse, VerifyPaymentResponse } from '@/misc/types/paystack';

export const useInitializePaystack = () => {
  return useMutation<InitializePaymentResponse, unknown, InitializeCoursePaymentPayload>({
    mutationFn: async (data) => {
      const response = await api.post<InitializePaymentResponse>('/paystack/initialize', data);
      return response.data;
    },
  });
};

export const useVerifyPaystackPayment = () => {
  return useMutation<VerifyPaymentResponse, unknown, string>({
    mutationFn: async (reference) => {
      const response = await api.get<VerifyPaymentResponse>(`/paystack/verify/${reference}`);
      return response.data;
    },
  });
};
