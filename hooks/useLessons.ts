import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Booking } from '@/types';

export const usePendingLessons = (role?: string) => {
  return useQuery<Booking[]>({
    queryKey: ['lessons', 'pending'],
    queryFn: async () => {
      const response = await api.get('/lessons/parent/pending');
      return response.data.lessons || [];
    },
    enabled: role === 'parent',
  });
};

export const useConfirmLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, otp }: { lessonId: string | number; otp: string }) => {
      const response = await api.post(`/lessons/${lessonId}/confirm`, { otp });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', 'pending'] });
    },
  });
};