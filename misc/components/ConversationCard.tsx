'use client';

import { useUser } from '@/misc/context/UserContext';
import { useAcceptConversation, useDeclineConversation } from '@/misc/hooks/api/chat';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import type { Conversation } from '@/misc/types/chat';

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

export default function ConversationCard({ conversation, isSelected, onClick }: ConversationCardProps) {
  const { user } = useUser();
  const accept = useAcceptConversation();
  const decline = useDeclineConversation();

  const other = conversation.participants?.find((p) => p.id !== user?.id) || conversation.participants?.[0];
  const fullName = other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() : 'Unknown';
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isPending = conversation.status === 'pending';
  const isDeclined = conversation.status === 'declined';
  const isSender = conversation.participants?.[0]?.id === user?.id;

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await accept.mutateAsync(conversation.id);
      toast.success('Chat request accepted');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await decline.mutateAsync(conversation.id);
      toast.success('Chat request declined');
    } catch {
      toast.error('Failed to decline request');
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
        isSelected ? 'bg-[#001A72]/5 border-r-2 border-[#001A72]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {other?.photoUrl ? (
          <img src={other.photoUrl} alt={fullName} className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold ${
            isDeclined ? 'bg-gray-400' : 'bg-gradient-to-br from-[#001A72] to-[#001A72]/70'
          }`}>
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold truncate ${isDeclined ? 'text-gray-400' : 'text-gray-900'}`}>
            {fullName}
          </p>
          {isPending && !isSender && (
            <div className="flex gap-1 shrink-0 ml-2">
              <button
                onClick={handleAccept}
                disabled={accept.isPending || decline.isPending}
                className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition disabled:opacity-50"
                title="Accept"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleDecline}
                disabled={accept.isPending || decline.isPending}
                className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50"
                title="Decline"
              >
                <span className="text-sm font-bold leading-none">✕</span>
              </button>
            </div>
          )}
        </div>

        {isPending && (
          <p className={`text-xs mt-0.5 font-medium ${isDeclined ? 'text-red-400' : isSender ? 'text-amber-500' : 'text-[#001A72]'}`}>
            {isDeclined ? 'Declined' : isSender ? 'Request sent — awaiting response' : 'Chat request — accept or decline'}
          </p>
        )}

        {isPending && !isSender && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            Tap accept to start chatting
          </p>
        )}

        {!isPending && !isDeclined && (
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-500 truncate">
              {conversation.lastMessage
                ? conversation.lastMessage.type === 'image'
                  ? '📷 Image'
                  : conversation.lastMessage.type === 'file'
                  ? '📎 File'
                  : conversation.lastMessage.content.length > 50
                  ? conversation.lastMessage.content.slice(0, 50) + '...'
                  : conversation.lastMessage.content
                : 'No messages yet'}
            </p>
            {(conversation.unreadCount ?? 0) > 0 && (
              <span className="shrink-0 ml-2 w-5 h-5 bg-[#001A72] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
