import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { ProgressReport } from '@/misc/types';

export const useMyProgressReports = () => {
  return useQuery<ProgressReport[]>({
    queryKey: ['progress-reports', 'my'],
    queryFn: async () => {
      const response = await api.get<ProgressReport[]>('/progress-reports/my');
      return response.data;
    },
  });
};
