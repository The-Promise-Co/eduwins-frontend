import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { WelfareFund } from '@/misc/types/welfare';

export const useWelfareFund = (userId: string | undefined) => {
  return useQuery<WelfareFund>({
    queryKey: ['welfare-fund', userId],
    queryFn: async () => {
      const response = await api.get<WelfareFund>(`/payments/welfare-fund/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

export const useWithdrawWelfare = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, { amount: number }>({
    mutationFn: async (data) => {
      const response = await api.post(`/payments/welfare-fund/${userId}/withdraw`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welfare-fund', userId] });
    },
  });
};
