import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { TeacherProfile } from '@/misc/types';
import type {
  AdminOverview,
  WelfareAnalytics,
  Dispute,
  AdminStatsData,
  AdminBooking,
} from '@/misc/types/admin';

export const useAdminOverview = () => {
  return useQuery<AdminOverview>({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await api.get<AdminOverview>('/api/admin/overview');
      return response.data;
    },
  });
};

export const useAdminRentApplications = () => {
  return useQuery<unknown[]>({
    queryKey: ['admin', 'rent-applications'],
    queryFn: async () => {
      const response = await api.get('/api/admin/rent-applications');
      return response.data;
    },
  });
};

export const useAdminAmbassadors = () => {
  return useQuery<unknown[]>({
    queryKey: ['admin', 'ambassadors'],
    queryFn: async () => {
      const response = await api.get('/api/admin/ambassadors');
      return response.data;
    },
  });
};

export const useAdminVetting = () => {
  return useQuery<TeacherProfile[]>({
    queryKey: ['admin', 'vetting'],
    queryFn: async () => {
      const response = await api.get<TeacherProfile[]>('/api/admin/vetting');
      return response.data;
    },
  });
};

export const useAdminDisputes = () => {
  return useQuery<Dispute[]>({
    queryKey: ['admin', 'disputes'],
    queryFn: async () => {
      const response = await api.get<Dispute[]>('/api/admin/disputes');
      return response.data;
    },
  });
};

export const useAdminWelfareAnalytics = () => {
  return useQuery<WelfareAnalytics>({
    queryKey: ['admin', 'welfare-analytics'],
    queryFn: async () => {
      const response = await api.get<WelfareAnalytics>('/api/admin/welfare-analytics');
      return response.data;
    },
  });
};

export const useUpdateRentApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, { id: string | number; status: string }>({
    mutationFn: async ({ id, status }) => {
      const response = await api.post(`/api/admin/rent-applications/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rent-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
};

export const useUpdateVetting = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string }, unknown, { teacherId: string | number; action: string }>({
    mutationFn: async ({ teacherId, action }) => {
      const response = await api.post(`/api/admin/vetting/${teacherId}`, { action });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vetting'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });
};

export const useUpdateDispute = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, { disputeId: string | number; status: string }>({
    mutationFn: async ({ disputeId, status }) => {
      const response = await api.patch(`/api/admin/disputes/${disputeId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });
};

export const useTeachersPending = () => {
  return useQuery<TeacherProfile[]>({
    queryKey: ['admin', 'teachers-pending'],
    queryFn: async () => {
      const response = await api.get<TeacherProfile[]>('/admin/teachers-pending');
      return response.data;
    },
  });
};

export const useBookingsPending = () => {
  return useQuery<AdminBooking[]>({
    queryKey: ['admin', 'bookings-pending'],
    queryFn: async () => {
      const response = await api.get<AdminBooking[]>('/admin/bookings-pending');
      return response.data;
    },
  });
};

export const useAdminStats = () => {
  return useQuery<AdminStatsData>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get<AdminStatsData>('/admin/stats');
      return response.data;
    },
  });
};

export const useApproveTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string>({
    mutationFn: async (teacherId) => {
      const response = await api.put(`/admin/teachers/${teacherId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers-pending'] });
    },
  });
};

export const useRejectTeacher = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string>({
    mutationFn: async (teacherId) => {
      const response = await api.put(`/admin/teachers/${teacherId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers-pending'] });
    },
  });
};

export const useReleaseBookingFunds = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string>({
    mutationFn: async (bookingId) => {
      const response = await api.put(`/admin/bookings/${bookingId}/release-funds`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};
