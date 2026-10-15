import { useQuery } from '@tanstack/react-query';
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
