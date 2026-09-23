'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/misc/components/PageHeader';
import ChatLayout from '@/misc/components/ChatLayout';
import { useConversations } from '@/misc/hooks/api/chat';
import { useSocket } from '@/misc/hooks/useSocket';
import type { Conversation, Message } from '@/misc/types/chat';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading } = useConversations();
  const { isConnected, connectionError, on, off } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const conversations = data?.conversations || [];

  useEffect(() => {
    const id = searchParams.get('conversationId');
    if (id) setSelectedConversationId(id);
  }, [searchParams]);

  // Live-refresh the conversation list when the other party sends a request
  // or accepts/declines one (30s polling remains as fallback).
  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };
    on('chat:new_conversation', refresh);
    on('chat:conversation_updated', refresh);
    return () => {
      off('chat:new_conversation', refresh);
      off('chat:conversation_updated', refresh);
    };
  }, [on, off, queryClient]);

  // Global fallback for incoming messages (arrives via the recipient's
  // personal user-room even when the conversation room join was lost).
  // Appends to the cached history with id-dedupe so the open conversation
  // picks it up through its existing sync, and refreshes the list preview.
  useEffect(() => {
    const handleIncoming = ({ message }: { message: Message | null }) => {
      if (!message?.id || !message.conversationId) return;
      const cid = message.conversationId;
      queryClient.setQueryData<{ messages: Message[] }>(
        ['chat', 'messages', cid],
        (old) => {
          if (!old) return { messages: [message] };
          if (old.messages.some((m) => m.id === message.id)) return old;
          return { messages: [...old.messages, message] };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };
    on('chat:new_message', handleIncoming);
    return () => {
      off('chat:new_message', handleIncoming);
    };
  }, [on, off, queryClient]);

  const handleSelect = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  const statusText = connectionError && !isConnected ? 'Connection failed' : isConnected ? 'Connected' : 'Connecting...';

  return (
    <div className="h-full flex flex-col space-y-4 pb-6">
      <PageHeader
        title="Messages"
        subtitle={connectionError && !isConnected ? connectionError : statusText}
        rightElement={
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
            isConnected
              ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
              : connectionError
                ? 'text-red-600 bg-red-50 border-red-100'
                : 'text-amber-600 bg-amber-50 border-amber-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : connectionError ? 'bg-red-500' : 'bg-amber-400'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#001A72] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ChatLayout
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelect}
        />
      )}
    </div>
  );
}
