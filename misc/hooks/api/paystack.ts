import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { BookingPaymentQuote, InitializeBookingPaymentPayload, InitializeCoursePaymentPayload, InitializePaymentResponse, VerifyPaymentResponse } from '@/misc/types/paystack';

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

export const useInitializeBookingPayment = () => {
  return useMutation<InitializePaymentResponse, unknown, InitializeBookingPaymentPayload>({
    mutationFn: async (data) => {
      const response = await api.post<InitializePaymentResponse>('/paystack/initialize', data);
      return response.data;
    },
  });
};

/**
 * Display-only fee estimate for the pay modal: session total + estimated
 * processing fee + estimated charge total. Initialize always sends
 * totalAmount; chargeAmount is what the Pay button shows.
 */
export const useBookingPaymentQuote = (bookingId: string | undefined) => {
  return useQuery<BookingPaymentQuote>({
    queryKey: ['paystack', 'quote', bookingId],
    queryFn: async () => {
      const response = await api.get<BookingPaymentQuote>('/paystack/quote', {
        params: { booking_id: bookingId },
      });
      return response.data;
    },
    enabled: !!bookingId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export interface CoursePaymentQuote extends BookingPaymentQuote {
  courseId: string;
}

/** Display-only fee estimate for course purchase: price + fee + est. total. */
export const useCoursePaymentQuote = (courseId: string | undefined) => {
  return useQuery<CoursePaymentQuote>({
    queryKey: ['paystack', 'quote', 'course', courseId],
    queryFn: async () => {
      const response = await api.get<CoursePaymentQuote>('/paystack/quote', {
        params: { course_id: courseId },
      });
      return response.data;
    },
    enabled: !!courseId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
