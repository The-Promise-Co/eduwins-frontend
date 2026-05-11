import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export const useSubjects = () => {
  return useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/subjects');
      console.log("subjects", response.data);
      return response.data;
    },
  });
};

export const useCourse = (id: string) => {
  return useQuery<any>({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await api.get(`/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddModule = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; order_index?: number }) => {
      const response = await api.post(`/courses/${courseId}/modules`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useAddLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleId, ...data }: { moduleId: string; title: string; type: string; video_url?: string; duration_seconds?: number; content?: string; order_index?: number; is_preview?: boolean }) => {
      const response = await api.post(`/courses/modules/${moduleId}/lessons`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useUpdateCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useUpdateLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lessonId, ...data }: { lessonId: string; title?: string; type?: string; video_url?: string; duration_seconds?: number; content?: string; is_preview?: boolean }) => {
      const response = await api.put(`/courses/lessons/${lessonId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useDeleteLesson = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/courses/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};
