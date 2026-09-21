'use client';

import { useState } from 'react';
import { X, Mail, ArrowRight, Check, User } from 'lucide-react';
import { useLookupByEmail, useSendChatRequest } from '@/misc/hooks/api/chat';
import { toast } from 'sonner';

interface UserSearchModalProps {
  onClose: () => void;
}

export default function UserSearchModal({ onClose }: UserSearchModalProps) {
  const [email, setEmail] = useState('');
  const { data: user, isLoading: looking, error } = useLookupByEmail(email);
  const sendRequest = useSendChatRequest();

  const handleSend = async () => {
    if (!user) return;
    try {
      await sendRequest.mutateAsync(user.email);
      toast.success('Chat request sent!');
      onClose();
    } catch {
      toast.error('Failed to send chat request');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && user && !sendRequest.isPending) {
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">New Conversation</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="name@example.com"
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
            />
          </div>
        </div>

        {/* Lookup result */}
        <div className="px-5 pb-5">
          {email.includes('@') && email.length >= 5 && looking && (
            <div className="flex items-center gap-3 py-4 justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#001A72] rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Looking up user...</span>
            </div>
          )}

          {error && !looking && email.includes('@') && (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-500">No user found with that email</p>
            </div>
          )}

          {user && !looking && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#001A72] to-[#001A72]/70 flex items-center justify-center text-white text-sm font-bold">
                    {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] text-gray-400">{user.email}</p>
                  <p className="text-[11px] text-gray-400 capitalize">{user.role}</p>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sendRequest.isPending}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#001A72] text-white text-sm font-medium rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
              >
                {sendRequest.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Chat Request
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {!email.includes('@') && !looking && (
            <p className="text-center text-xs text-gray-400 py-4">Enter an email to find a user</p>
          )}
        </div>
      </div>
    </div>
  );
}
