import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { PremiumContent } from '@/misc/types';
import type { SubscriptionStatus } from '@/misc/types/premium';

export const useSubscriptionStatus = () => {
  return useQuery<SubscriptionStatus>({
    queryKey: ['premium', 'subscription-status'],
    queryFn: async () => {
      const response = await api.get<SubscriptionStatus>('/premium/subscription/status');
      return response.data;
    },
  });
};

export const useSubscribe = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, { plan: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/premium/subscribe', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium', 'subscription-status'] });
    },
  });
};

export const useTeacherContent = () => {
  return useQuery<{ content?: PremiumContent[] }>({
    queryKey: ['premium', 'teacher-content'],
    queryFn: async () => {
      const response = await api.get('/premium/teacher-content');
      return response.data;
    },
  });
};
