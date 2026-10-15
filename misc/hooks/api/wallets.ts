import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { MyWalletsResponse, WalletTransactionsResponse } from '@/misc/types/wallets';

export const useMyWallets = () => {
  return useQuery<MyWalletsResponse>({
    queryKey: ['wallets', 'my'],
    queryFn: async () => {
      const response = await api.get<MyWalletsResponse>('/wallets/my');
      return response.data;
    },
  });
};

export const useWalletTransactions = (walletId?: string, page = 1, limit = 20) => {
  return useQuery<WalletTransactionsResponse>({
    queryKey: ['wallets', walletId, 'transactions', page, limit],
    queryFn: async () => {
      const response = await api.get<WalletTransactionsResponse>(`/wallets/${walletId}/transactions`, {
        params: { page, limit },
      });
      return response.data;
    },
    enabled: !!walletId,
  });
};
