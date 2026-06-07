import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { BalanceData, Bank, Withdrawal, HistoryStats } from '@/misc/types/withdrawals';

export const useAvailableBalance = () => {
  return useQuery<BalanceData>({
    queryKey: ['withdrawals', 'available-balance'],
    queryFn: async () => {
      const response = await api.get<BalanceData>('/withdrawals/available-balance');
      return response.data;
    },
  });
};

export const useBanks = () => {
  return useQuery<{ banks?: Bank[] }>({
    queryKey: ['withdrawals', 'banks'],
    queryFn: async () => {
      const response = await api.get('/withdrawals/banks/list');
      return response.data;
    },
  });
};

export const useWithdrawalHistory = (filterStatus: string) => {
  return useQuery<{ withdrawals?: Withdrawal[]; stats?: HistoryStats }>({
    queryKey: ['withdrawals', 'history', filterStatus],
    queryFn: async () => {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const response = await api.get(`/withdrawals/history${params}`);
      return response.data;
    },
    enabled: typeof filterStatus === 'string',
  });
};

export const useInitiateWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string }, unknown, Record<string, unknown>>({
    mutationFn: async (data) => {
      const response = await api.post('/withdrawals/initiate', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'available-balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'history'] });
    },
  });
};

export const useCancelWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string }, unknown, string>({
    mutationFn: async (withdrawalId) => {
      const response = await api.delete(`/withdrawals/${withdrawalId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'available-balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'history'] });
    },
  });
};
