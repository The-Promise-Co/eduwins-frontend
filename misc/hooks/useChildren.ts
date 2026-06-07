import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';

export interface Child {
  id: string;
  userId: string;
  parentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  grade?: string | null;
  school?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface RegisterChildInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  notes?: string;
}

export interface UpdateChildInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
  notes?: string;
}

export const useChildren = (role?: string) => {
  return useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: async () => {
      const response = await api.get('/children');
      return response.data.children || [];
    },
    enabled: role === 'parent',
  });
};

export const useChild = (childId: string) => {
  return useQuery<Child>({
    queryKey: ['child', childId],
    queryFn: async () => {
      const response = await api.get(`/children/${childId}`);
      return response.data.child;
    },
    enabled: !!childId,
  });
};

export const useRegisterChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegisterChildInput) => {
      const response = await api.post('/children', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};

export const useUpdateChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, data }: { childId: string; data: UpdateChildInput }) => {
      const response = await api.put(`/children/${childId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['child', variables.childId] });
    },
  });
};

export const useDeleteChild = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (childId: string) => {
      const response = await api.delete(`/children/${childId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};
