'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/misc/context/UserContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002';

let globalSocket: Socket | null = null;

export function useSocket() {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.token || globalSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    globalSocket = socket;
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat:user_online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    socket.on('chat:user_offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on(
      'chat:typing',
      ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const typingInConv = new Set(next.get(conversationId) || []);
          if (isTyping) {
            typingInConv.add(userId);
          } else {
            typingInConv.delete(userId);
          }
          if (typingInConv.size === 0) {
            next.delete(conversationId);
          } else {
            next.set(conversationId, typingInConv);
          }
          return next;
        });
      }
    );

    return () => {
      socket.disconnect();
      globalSocket = null;
      socketRef.current = null;
    };
  }, [user?.token]);

  const joinConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:join', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:leave', { conversationId });
  }, []);

  const sendMessage = useCallback(
    (data: { conversationId: string; content: string; type?: string; attachmentUrl?: string }) => {
      globalSocket?.emit('chat:send_message', data);
    },
    []
  );

  const startTyping = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:typing_start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:typing_stop', { conversationId });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:message_read', { conversationId });
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    globalSocket?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    globalSocket?.off(event, handler);
  }, []);

  return {
    socket: globalSocket,
    isConnected,
    onlineUsers,
    typingUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    on,
    off,
  };
}
