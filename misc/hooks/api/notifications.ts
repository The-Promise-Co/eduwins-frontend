import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';

export interface AppNotification {
  id: string;
  userId?: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
}

export const useNotifications = () => {
  return useQuery<{ notifications: AppNotification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
