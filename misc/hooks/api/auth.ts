import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { TeacherProfile } from '@/misc/types';
import type { LoginResponse, RegisterResponse, VerifyOtpResponse } from '@/misc/types/auth';

type UseMeOptions = { retry?: boolean; enabled?: boolean };

export const useMe = (enabled?: boolean, options?: UseMeOptions) => {
  return useQuery<TeacherProfile>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<TeacherProfile>('/auth/me');
      return response.data;
    },
    enabled,
    ...options,
  });
};

export const useLogin = () => {
  return useMutation<LoginResponse, unknown, { email: string; password: string }>({
    mutationFn: async (data) => {
      const response = await api.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
  });
};

export const useRegister = () => {
  return useMutation<RegisterResponse, unknown, {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
    referralCode?: string;
  }>({
    mutationFn: async (data) => {
      const response = await api.post<RegisterResponse>('/auth/register', data);
      return response.data;
    },
  });
};

export const useForgotPassword = () => {
  return useMutation<{ message?: string }, unknown, { email: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    },
  });
};

export const useValidateResetToken = (token: string | null) => {
  return useQuery<unknown>({
    queryKey: ['auth', 'reset-token', token],
    queryFn: async () => {
      const response = await api.get(`/auth/validate-reset-token?token=${token}`);
      return response.data;
    },
    enabled: !!token,
  });
};

export const useResetPassword = () => {
  return useMutation<{ message?: string }, unknown, { token: string; newPassword: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/auth/reset-password', data);
      return response.data;
    },
  });
};

export const useResendOtp = () => {
  return useMutation<{ message?: string }, unknown, { token: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/auth/resend-otp', data);
      return response.data;
    },
  });
};

export const useVerifyOtp = () => {
  return useMutation<VerifyOtpResponse, unknown, { token: string; otp: string; is2FA: boolean }>({
    mutationFn: async (data) => {
      const endpoint = data.is2FA ? '/auth/verify-2fa' : '/auth/verify-email';
      const response = await api.post<VerifyOtpResponse>(endpoint, data);
      return response.data;
    },
  });
};

export const useUpdateProfile = () => {
  return useMutation<{ message?: string }, unknown, Record<string, unknown>>({
    mutationFn: async (data) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
  });
};

export const useToggle2FA = () => {
  return useMutation<{ message?: string }, unknown, void>({
    mutationFn: async () => {
      const response = await api.post('/auth/2fa/toggle');
      return response.data;
    },
  });
};
