'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Clock, XCircle } from 'lucide-react';
import { useUser } from '@/misc/context/UserContext';
import { useMessages, useLoadMoreMessages, useMarkConversationRead } from '@/misc/hooks/api/chat';
import { useSocket } from '@/misc/hooks/useSocket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import type { Conversation, Message } from '@/misc/types/chat';
import { toast } from 'sonner';

interface ChatMessageListProps {
  conversation: Conversation | null;
  onBack: () => void;
}

export default function ChatMessageList({ conversation, onBack }: ChatMessageListProps) {
  const { user } = useUser();
  const { joinConversation, leaveConversation, sendMessage: socketSendMessage, startTyping, stopTyping, on, off, typingUsers, isConnected } = useSocket();
  const { data, isLoading } = useMessages(conversation?.id || null);
  const loadMore = useLoadMoreMessages(conversation?.id || '');
  const markRead = useMarkConversationRead();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const other = conversation?.participants?.find((p) => p.id !== user?.id) || conversation?.participants?.[0];
  const fullName = other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() : 'Unknown';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isPending = conversation?.status === 'pending';
  const isDeclined = conversation?.status === 'declined';
  const isSender = conversation?.participants?.[0]?.id === user?.id;
  const isAccepted = conversation?.status === 'accepted';

  // Sync server messages to local state
  useEffect(() => {
    if (data?.messages) {
      setLocalMessages(data.messages);
    }
  }, [data?.messages]);

  // Join/leave conversation room (only for accepted). Re-runs on reconnect
  // because server-side room membership is lost on every disconnect.
  useEffect(() => {
    if (!conversation?.id || !isAccepted || !isConnected) return;
    joinConversation(conversation.id);
    return () => leaveConversation(conversation.id);
  }, [conversation?.id, isAccepted, isConnected, joinConversation, leaveConversation]);

  // Listen for new messages (only for accepted)
  useEffect(() => {
    if (!conversation?.id || !isAccepted) return;

    const handleChatError = ({ message }: { message?: string }) => {
      toast.error(message || 'Failed to send message');
    };

    const handleNewMessage = ({ message }: { message: Message | null }) => {
      if (!message || message.conversationId !== conversation.id) return;
      setLocalMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
      if (conversationId === conversation.id) {
        setLocalMessages((prev) =>
          prev.map((m) => (m.senderId === user?.id ? { ...m } : m))
        );
      }
    };

    on('chat:new_message', handleNewMessage);
    on('chat:messages_read', handleMessagesRead);
    on('chat:error', handleChatError);

    return () => {
      off('chat:new_message', handleNewMessage);
      off('chat:messages_read', handleMessagesRead);
      off('chat:error', handleChatError);
    };
  }, [conversation?.id, isAccepted, on, off, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages.length]);

  // Mark as read when viewing
  useEffect(() => {
    if (!conversation?.id || !isAccepted) return;
    markRead.mutate(conversation.id);
  }, [conversation?.id, isAccepted, localMessages.length]);

  // Scroll to top to load more
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || container.scrollTop > 50 || loadMore.isPending || localMessages.length < 50) return;

    const firstMsg = localMessages[0];
    if (firstMsg) {
      loadMore.mutate(firstMsg.id);
    }
  }, [localMessages, loadMore]);

  // Typing indicator
  const convTyping = conversation?.id ? typingUsers.get(conversation.id) : undefined;
  const typingOthers = convTyping
    ? Array.from(convTyping).filter((id) => id !== user?.id)
    : [];

  const handleTyping = useCallback(() => {
    if (!conversation?.id || !isAccepted) return;
    if (!isTyping) {
      setIsTyping(true);
      startTyping(conversation.id);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversation.id!);
    }, 2000);
  }, [conversation?.id, isAccepted, isTyping, startTyping, stopTyping]);

  const handleSend = (content: string, type = 'text', attachmentUrl?: string): boolean => {
    if (!conversation?.id || !isAccepted) return false;
    if (!isConnected) {
      toast.error('Not connected. Please wait a moment and try again.');
      return false;
    }
    const sent = socketSendMessage({ conversationId: conversation.id, content, type, attachmentUrl });
    if (!sent) {
      toast.error('Failed to send message. Please try again.');
      return false;
    }
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    return true;
  };

  // Pending/declined state
  if (isPending || isDeclined) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <button onClick={onBack} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          {other?.photoUrl ? (
            <img src={other.photoUrl} alt={fullName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#001A72] to-[#001A72]/70 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
            <p className="text-[11px] text-gray-400 capitalize">{other?.role}</p>
          </div>
        </div>

        {/* Status message */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-xs">
            {isPending && (
              <>
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {isSender ? 'Waiting for response' : 'Chat request pending'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isSender
                    ? `${other?.firstName || 'This user'} hasn't responded yet`
                    : `${other?.firstName || 'Someone'} wants to chat with you. Accept from the conversation list.`}
                </p>
              </>
            )}
            {isDeclined && (
              <>
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle size={24} className="text-red-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Chat request declined</p>
                <p className="text-xs text-gray-400 mt-1">This conversation is no longer active.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        {other?.photoUrl ? (
          <img src={other.photoUrl} alt={fullName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#001A72] to-[#001A72]/70 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
          {typingOthers.length > 0 ? (
            <p className="text-[11px] text-[#001A72] font-medium">typing...</p>
          ) : (
            <p className="text-[11px] text-gray-400 capitalize">{other?.role}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#001A72] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {loadMore.isPending && (
              <div className="text-center py-2">
                <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {localMessages.map((msg, i) => {
              const showAvatar = i === 0 || localMessages[i - 1]?.senderId !== msg.senderId;
              return (
                <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === user?.id} showAvatar={showAvatar} />
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingOthers.length > 0 && (
        <div className="px-4 py-1">
          <TypingIndicator names={typingOthers.map(() => other?.firstName || 'Someone')} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}
