'use client';

import { useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/misc/context/UserContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002';

// ── Module-level singleton ─────────────────────────────────────────
// The JWT lives in localStorage (see UserContext + api interceptor) — it is
// never set on the user object, so the socket must read it from storage.
let globalSocket: Socket | null = null;
let globalConnectToken: string | null = null;
let consumerCount = 0;

interface ConnState {
  connected: boolean;
  error: string | null;
}

let lastConnState: ConnState = { connected: false, error: null };
const connSubscribers = new Set<(s: ConnState) => void>();

function broadcastConnState(next: ConnState) {
  lastConnState = next;
  connSubscribers.forEach((fn) => {
    try {
      fn(next);
    } catch {
      // ignore subscriber errors
    }
  });
}

// Event registry so `on()` works even when called before the socket exists
// (e.g. parent effects registering before the child effect creates it).
// Registered handlers are replayed onto every newly created socket.
const eventRegistry = new Map<string, Set<(...args: any[]) => void>>();

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function subscribeConn(fn: (s: ConnState) => void) {
  connSubscribers.add(fn);
  return () => {
    connSubscribers.delete(fn);
  };
}

function getConnSnapshot(): ConnState {
  return lastConnState;
}

function ensureSocket(token: string) {
  if (globalSocket && globalConnectToken === token) {
    // Same session — make sure we're (re)connecting; socket.io treats
    // connect() as a no-op when already connected/connecting.
    if (!globalSocket.connected) globalSocket.connect();
    return;
  }

  // New session (or first connect) — drop any stale socket first.
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    broadcastConnState({ connected: true, error: null });
  });

  socket.on('disconnect', () => {
    broadcastConnState({ connected: false, error: null });
  });

  socket.on('connect_error', (err: Error) => {
    broadcastConnState({ connected: false, error: err?.message || 'Connection failed' });
  });

  // Replay handlers registered via `on()` before the socket existed.
  eventRegistry.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler));
  });

  attachPresenceListeners(socket);

  globalSocket = socket;
  globalConnectToken = token;
}

export function useSocket() {
  const { isAuthenticated } = useUser();
  const connState = useSyncExternalStore(subscribeConn, getConnSnapshot, getConnSnapshot);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    consumerCount += 1;
    ensureSocket(token);

    return () => {
      consumerCount -= 1;
      if (consumerCount <= 0) {
        consumerCount = 0;
        globalSocket?.disconnect();
        globalSocket = null;
        globalConnectToken = null;
      }
    };
  }, [isAuthenticated]);

  const joinConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:join', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    globalSocket?.emit('chat:leave', { conversationId });
  }, []);

  const sendMessage = useCallback(
    (data: { conversationId: string; content: string; type?: string; attachmentUrl?: string }): boolean => {
      if (!globalSocket?.connected) return false;
      globalSocket.emit('chat:send_message', data);
      return true;
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
    let handlers = eventRegistry.get(event);
    if (!handlers) {
      handlers = new Set();
      eventRegistry.set(event, handlers);
    }
    handlers.add(handler);
    globalSocket?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    eventRegistry.get(event)?.delete(handler);
    globalSocket?.off(event, handler);
  }, []);

  const onlineUsers = useOnlineUsers();
  const typingUsers = useTypingUsers();

  return {
    socket: globalSocket,
    isConnected: connState.connected,
    connectionError: connState.error,
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

// ── Presence & typing state ────────────────────────────────────────
// Kept as separate subscriptions so chat components only re-render on the
// slices they actually consume.
let onlineSnapshot: Set<string> = new Set();
const onlineSubscribers = new Set<() => void>();

let typingSnapshot: Map<string, Set<string>> = new Map();
const typingSubscribers = new Set<() => void>();

let presenceListenersAttached = false;

function attachPresenceListeners(socket: Socket) {
  if (presenceListenersAttached) return;
  presenceListenersAttached = true;

  socket.on('chat:user_online', ({ userId }: { userId: string }) => {
    onlineSnapshot = new Set(onlineSnapshot).add(userId);
    onlineSubscribers.forEach((fn) => fn());
  });

  socket.on('chat:user_offline', ({ userId }: { userId: string }) => {
    const next = new Set(onlineSnapshot);
    next.delete(userId);
    onlineSnapshot = next;
    onlineSubscribers.forEach((fn) => fn());
  });

  socket.on(
    'chat:typing',
    ({ conversationId, userId, isTyping }: { conversationId: string; userId: string; isTyping: boolean }) => {
      const next = new Map(typingSnapshot);
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
      typingSnapshot = next;
      typingSubscribers.forEach((fn) => fn());
    }
  );
}

function useOnlineUsers(): Set<string> {
  return useSyncExternalStore(
    (fn) => {
      onlineSubscribers.add(fn);
      return () => {
        onlineSubscribers.delete(fn);
      };
    },
    () => onlineSnapshot,
    () => onlineSnapshot
  );
}

function useTypingUsers(): Map<string, Set<string>> {
  return useSyncExternalStore(
    (fn) => {
      typingSubscribers.add(fn);
      return () => {
        typingSubscribers.delete(fn);
      };
    },
    () => typingSnapshot,
    () => typingSnapshot
  );
}
