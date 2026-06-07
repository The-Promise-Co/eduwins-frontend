import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { ProfileCompletion } from '@/misc/types/uploads';

export const useProfileCompletion = () => {
  return useQuery<ProfileCompletion>({
    queryKey: ['uploads', 'profile-completion'],
    queryFn: async () => {
      const response = await api.get<ProfileCompletion>('/uploads/profile-completion');
      return response.data;
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string; user?: Record<string, unknown> }, unknown, { endpoint: string; data: FormData }>({
    mutationFn: async ({ endpoint, data }) => {
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', 'profile-completion'] });
    },
  });
};
