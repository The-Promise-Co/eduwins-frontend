'use client';

import { useState } from 'react';
import { Search, X, MessageSquarePlus } from 'lucide-react';
import ConversationCard from './ConversationCard';
import UserSearchModal from './UserSearchModal';
import type { Conversation } from '@/misc/types/chat';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Split into pending requests and active conversations
  const pending = conversations.filter((c) => c.status === 'pending');
  const active = conversations.filter((c) => c.status === 'accepted');
  const declined = conversations.filter((c) => c.status === 'declined');

  const filterList = (list: Conversation[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => {
      const other = c.participants?.[0];
      const name = other ? `${other.firstName || ''} ${other.lastName || ''}`.trim().toLowerCase() : '';
      const email = other?.email?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || (c.lastMessage?.content || '').toLowerCase().includes(q);
    });
  };

  const filteredActive = filterList(active);
  const filteredPending = filterList(pending);
  const filteredDeclined = filterList(declined);

  return (
    <>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowUserSearch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001A72] text-white text-xs font-medium rounded-full hover:bg-[#001A72]/90 transition"
          >
            <MessageSquarePlus size={14} />
            New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageSquarePlus size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start one by entering someone&apos;s email</p>
            <button
              onClick={() => setShowUserSearch(true)}
              className="mt-3 text-sm font-medium text-[#001A72] hover:underline"
            >
              Send a chat request
            </button>
          </div>
        ) : (
          <>
            {/* Pending requests */}
            {filteredPending.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-black tracking-[0.2em] text-[#001A72] uppercase">
                  Requests ({filteredPending.length})
                </p>
                {filteredPending.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedId}
                    onClick={() => onSelect(conversation)}
                  />
                ))}
              </div>
            )}

            {/* Active conversations */}
            {filteredActive.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
                  Active
                </p>
                {filteredActive.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedId}
                    onClick={() => onSelect(conversation)}
                  />
                ))}
              </div>
            )}

            {/* Declined */}
            {filteredDeclined.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
                  Declined
                </p>
                {filteredDeclined.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={conversation.id === selectedId}
                    onClick={() => onSelect(conversation)}
                  />
                ))}
              </div>
            )}

            {/* No results */}
            {filteredActive.length === 0 && filteredPending.length === 0 && filteredDeclined.length === 0 && searchQuery && (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No conversations match your search</p>
              </div>
            )}
          </>
        )}
      </div>

      {showUserSearch && (
        <UserSearchModal onClose={() => setShowUserSearch(false)} />
      )}
    </>
  );
}
