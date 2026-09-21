'use client';

import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatMessageList from './ChatMessageList';
import type { Conversation } from '@/misc/types/chat';

interface ChatLayoutProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function ChatLayout({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ChatLayoutProps) {
  const [mobileShowMessages, setMobileShowMessages] = useState(false);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  const handleSelect = (conversation: Conversation) => {
    onSelectConversation(conversation);
    setMobileShowMessages(true);
  };

  const handleBack = () => {
    setMobileShowMessages(false);
  };

  return (
    <div className="flex h-[calc(100vh-180px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Conversation list */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex-shrink-0 flex flex-col ${
          mobileShowMessages && selectedConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelect}
        />
      </div>

      {/* Message area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          !mobileShowMessages && selectedConversationId ? 'hidden md:flex' : selectedConversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConversationId ? (
          <ChatMessageList
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-900 font-bold">Select a conversation</p>
              <p className="text-sm text-gray-500 mt-1">Choose from the list or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
