import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type { Conversation, Message } from '@/misc/types/chat';

export const useConversations = () => {
  return useQuery<{ conversations: Conversation[] }>({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      const response = await api.get('/chat/conversations');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useMessages = (conversationId: string | null) => {
  return useQuery<{ messages: Message[] }>({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: async () => {
      const response = await api.get(`/chat/conversations/${conversationId}/messages?limit=50`);
      return response.data;
    },
    enabled: !!conversationId,
  });
};

export const useLoadMoreMessages = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (beforeMessageId: string) => {
      const response = await api.get(
        `/chat/conversations/${conversationId}/messages?before=${beforeMessageId}&limit=50`
      );
      return response.data.messages as Message[];
    },
    onSuccess: (olderMessages) => {
      queryClient.setQueryData<{ messages: Message[] }>(
        ['chat', 'messages', conversationId],
        (old) => {
          if (!old) return { messages: olderMessages };
          return { messages: [...olderMessages, ...old.messages] };
        }
      );
    },
  });
};

export const useSendChatRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/chat/conversations/request', { email });
      return response.data.conversation as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useAcceptConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.patch(`/chat/conversations/${conversationId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useDeclineConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.patch(`/chat/conversations/${conversationId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.patch(`/chat/conversations/${conversationId}/read`);
    },
    onSuccess: (_data, conversationId) => {
      queryClient.setQueryData<{ conversations: Conversation[] }>(
        ['chat', 'conversations'],
        (old) => {
          if (!old) return old;
          return {
            conversations: old.conversations.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            ),
          };
        }
      );
    },
  });
};

export const useLookupByEmail = (email: string) => {
  return useQuery({
    queryKey: ['chat', 'lookup', email],
    queryFn: async () => {
      const response = await api.get(`/chat/users/lookup?email=${encodeURIComponent(email)}`);
      return response.data.user as {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        photoUrl: string | null;
        role: string;
      };
    },
    enabled: email.includes('@') && email.length >= 5,
  });
};
