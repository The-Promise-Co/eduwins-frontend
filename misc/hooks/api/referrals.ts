import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { MyReferralsResponse } from '@/misc/types/referrals';

export const useMyReferrals = () => {
  return useQuery<MyReferralsResponse>({
    queryKey: ['referrals', 'my'],
    queryFn: async () => {
      const response = await api.get<MyReferralsResponse>('/referrals/my');
      return response.data;
    },
  });
};
