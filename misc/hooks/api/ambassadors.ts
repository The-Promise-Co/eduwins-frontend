import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { AmbassadorData } from '@/misc/types/ambassadors';

export const useAmbassadorMe = () => {
  return useQuery<AmbassadorData>({
    queryKey: ['ambassadors', 'me'],
    queryFn: async () => {
      const response = await api.get<AmbassadorData>('/api/ambassadors/me');
      return response.data;
    },
  });
};

export const useApplyAmbassador = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, void>({
    mutationFn: async () => {
      const response = await api.post('/api/ambassadors/apply');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambassadors', 'me'] });
    },
  });
};
