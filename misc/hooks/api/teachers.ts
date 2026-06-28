import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { TeacherProfile } from '@/misc/types';
import type { TeacherSearchResult } from '@/misc/types/teachers';

export const useTeacherProfile = (id: string | undefined) => {
  return useQuery<TeacherProfile>({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const response = await api.get<TeacherProfile>(`/teachers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useTeacherSearch = (params: string = '') => {
  return useQuery<{ data?: TeacherSearchResult[]; meta?: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['teachers', 'search', params],
    queryFn: async () => {
      const query = params ? `?${params}` : '';
      const response = await api.get(`/teachers/search${query}`);
      return response.data;
    },
  });
};

export const useUploadPhoto = () => {
  return useMutation<{ photoUrl: string }, unknown, FormData>({
    mutationFn: async (data) => {
      const response = await api.post<{ photoUrl: string }>('/teachers/upload-photo', data);
      return response.data;
    },
  });
};
