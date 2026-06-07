import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import { Course, CourseFormInput } from '@/misc/types/course';
import type { PaginatedResponse, CreateCourseResponse, AnalyticSnapshot, StudentEnrolled } from '@/misc/types/courses';

export const usePublicCourses = (page: number) => {
  return useQuery<PaginatedResponse<Course>>({
    queryKey: ['public-courses', page],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Course>>(`/courses?page=${page}&limit=12`);
      return response.data;
    },
  });
};

export const usePublicCourse = (id: string | undefined) => {
  return useQuery<Course>({
    queryKey: ['public-course', id],
    queryFn: async () => {
      const response = await api.get<Course>(`/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCourses = (role: string | undefined, userId: string | undefined, page: number) => {
  return useQuery<PaginatedResponse<Course>>({
    queryKey: ['courses', role, userId, page],
    queryFn: async () => {
      const baseUrl = role === 'teacher' ? `/courses/my-courses` : '/courses';
      const response = await api.get<PaginatedResponse<Course>>(`${baseUrl}?page=${page}&limit=12`);
      return response.data;
    },
    enabled: !!role && !!userId,
  });
};

export const useCourseDetail = (id: string | undefined) => {
  return useQuery<Course>({
    queryKey: ['courses', id],
    queryFn: async () => {
      const response = await api.get<Course>(`/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCourseAnalytics = (id: string | undefined) => {
  return useQuery<AnalyticSnapshot[]>({
    queryKey: ['courses', id, 'analytics'],
    queryFn: async () => {
      const response = await api.get<AnalyticSnapshot[]>(`/courses/${id}/analytics`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCourseStudents = (id: string | undefined) => {
  return useQuery<StudentEnrolled[]>({
    queryKey: ['courses', id, 'students'],
    queryFn: async () => {
      const response = await api.get<StudentEnrolled[]>(`/courses/${id}/students`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateCourseResponse, unknown, CourseFormInput | Record<string, unknown>>({
    mutationFn: async (data) => {
      const response = await api.post<CreateCourseResponse>('/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useEnrollCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, void>({
    mutationFn: async () => {
      const response = await api.post(`/courses/${id}/enroll`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses', id] });
    },
  });
};

export const useUpdateCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, Record<string, unknown>>({
    mutationFn: async (data) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useUpdateCourseById = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, { courseId: string; data: Record<string, unknown> }>({
    mutationFn: async ({ courseId, data }) => {
      const response = await api.put(`/courses/${courseId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};

export const useDeleteCourse = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<unknown, unknown, void>({
    mutationFn: async () => {
      await api.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
};
