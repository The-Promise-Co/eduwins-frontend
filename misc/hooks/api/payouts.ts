import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type {
  PayoutAccount,
  PayoutAccountChange,
  PayoutRequest,
  AvailableBalance,
  Bank,
} from '@/misc/types/payouts';

export const usePayoutAccount = () => {
  return useQuery<{ account: PayoutAccount | null }>({
    queryKey: ['payouts', 'account'],
    queryFn: async () => {
      const response = await api.get<{ account: PayoutAccount | null }>('/payouts/account');
      return response.data;
    },
  });
};

export const usePayoutAccountChanges = () => {
  return useQuery<{ changes: PayoutAccountChange[] }>({
    queryKey: ['payouts', 'account', 'changes'],
    queryFn: async () => {
      const response = await api.get<{ changes: PayoutAccountChange[] }>('/payouts/account/changes');
      return response.data;
    },
  });
};

export const useValidateAccount = () => {
  return useMutation<{ accountName: string }, unknown, { bankCode: string; accountNumber: string }>({
    mutationFn: async (data) => {
      const response = await api.post<{ accountName: string }>('/payouts/validate-account', data);
      return response.data;
    },
  });
};

export const useSavePayoutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { account: PayoutAccount },
    unknown,
    { bankCode: string; accountNumber: string; accountName: string }
  >({
    mutationFn: async (data) => {
      const response = await api.put('/payouts/account', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts', 'account'] });
      queryClient.invalidateQueries({ queryKey: ['payouts', 'account', 'changes'] });
    },
  });
};

export const useAvailableBalance = () => {
  return useQuery<AvailableBalance>({
    queryKey: ['payouts', 'available-balance'],
    queryFn: async () => {
      const response = await api.get<AvailableBalance>('/payouts/available-balance');
      return response.data;
    },
  });
};

export const useBanks = () => {
  return useQuery<{ banks: Bank[] }>({
    queryKey: ['payouts', 'banks'],
    queryFn: async () => {
      const response = await api.get<{ banks: Bank[] }>('/payouts/banks');
      return response.data;
    },
  });
};

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string; payoutId?: string }, unknown, { amount: number; narration?: string }>({
    mutationFn: async (data) => {
      const response = await api.post('/payouts/request', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts', 'available-balance'] });
      queryClient.invalidateQueries({ queryKey: ['payouts', 'history'] });
    },
  });
};

export const usePayoutHistory = () => {
  return useQuery<{ payouts: PayoutRequest[] }>({
    queryKey: ['payouts', 'history'],
    queryFn: async () => {
      const response = await api.get<{ payouts: PayoutRequest[] }>('/payouts/history');
      return response.data;
    },
    refetchInterval: (query) => {
      const payouts = query.state.data?.payouts ?? [];
      const active = payouts.some((p) => p.status === 'pending' || p.status === 'processing');
      return active ? 15000 : false;
    },
  });
};

export const useCancelPayout = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string }, unknown, string>({
    mutationFn: async (payoutId) => {
      const response = await api.post(`/payouts/${payoutId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts', 'available-balance'] });
      queryClient.invalidateQueries({ queryKey: ['payouts', 'history'] });
    },
  });
};
