'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PageHeader from '@/misc/components/PageHeader';
import ChatLayout from '@/misc/components/ChatLayout';
import { useConversations } from '@/misc/hooks/api/chat';
import { useSocket } from '@/misc/hooks/useSocket';
import type { Conversation } from '@/misc/types/chat';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const { data, isLoading } = useConversations();
  const { isConnected } = useSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const conversations = data?.conversations || [];

  useEffect(() => {
    const id = searchParams.get('conversationId');
    if (id) setSelectedConversationId(id);
  }, [searchParams]);

  const handleSelect = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  return (
    <div className="h-full flex flex-col space-y-4 pb-6">
      <PageHeader
        title="Messages"
        subtitle={isConnected ? 'Connected' : 'Connecting...'}
        rightElement={
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
            isConnected
              ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
              : 'text-amber-600 bg-amber-50 border-amber-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
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
