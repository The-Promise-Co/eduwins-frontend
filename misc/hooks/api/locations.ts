import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';

export const useStates = () => {
  return useQuery<string[]>({
    queryKey: ['locations', 'states'],
    queryFn: async () => {
      const res = await api.get<{ states: string[] }>('/locations/states');
      return res.data.states || [];
    },
    staleTime: Infinity,
  });
};

export const useLgas = (state: string) => {
  return useQuery<string[]>({
    queryKey: ['locations', 'lgas', state],
    queryFn: async () => {
      const res = await api.get<{ lgas: string[] }>(`/locations/lgas?state=${encodeURIComponent(state)}`);
      return res.data.lgas || [];
    },
    enabled: !!state,
    staleTime: Infinity,
  });
};
