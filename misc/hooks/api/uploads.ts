import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { ProfileCompletion } from '@/misc/types/uploads';
import type { TeacherDocument } from '@/misc/types';

export const useProfileCompletion = () => {
  return useQuery<ProfileCompletion>({
    queryKey: ['uploads', 'profile-completion'],
    queryFn: async () => {
      const response = await api.get<ProfileCompletion>('/uploads/profile-completion');
      return response.data;
    },
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message?: string; user?: Record<string, unknown> }, unknown, { endpoint: string; data: FormData }>({
    mutationFn: async ({ endpoint, data }) => {
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', 'profile-completion'] });
    },
  });
};

export const useTeacherDocuments = () => {
  return useQuery<TeacherDocument[]>({
    queryKey: ['uploads', 'documents'],
    queryFn: async () => {
      const response = await api.get<TeacherDocument[]>('/uploads/documents');
      return response.data;
    },
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<TeacherDocument, unknown, { file: File; name: string; tags: string[] }>({
    mutationFn: async ({ file, name, tags }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      tags.forEach((tag) => formData.append('tags', tag));
      const response = await api.post<TeacherDocument>('/uploads/documents', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['uploads', 'profile-completion'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (documentId) => {
      await api.delete(`/uploads/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['uploads', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['uploads', 'profile-completion'] });
    },
  });
};
