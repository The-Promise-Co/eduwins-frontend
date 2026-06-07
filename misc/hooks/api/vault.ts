import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { VaultItem } from '@/misc/types';

export const useVaultItems = (params: string) => {
  return useQuery<VaultItem[]>({
    queryKey: ['vault', params],
    queryFn: async () => {
      const response = await api.get<VaultItem[]>(`/vault?${params}`);
      return response.data;
    },
    enabled: !!params,
  });
};

export const usePurchaseVaultItem = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, string | number>({
    mutationFn: async (itemId) => {
      const response = await api.post(`/vault/${itemId}/purchase`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });
};

export const useCreateVaultItem = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, Record<string, unknown>>({
    mutationFn: async (data) => {
      const response = await api.post('/vault', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
    },
  });
};
