'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSendChatRequest } from '@/misc/hooks/api/chat';

export interface MessageTutorTarget {
  id: string;
  name?: string;
  photo?: string | null;
  subject?: string;
}

interface MessageTutorModalProps {
  tutor: MessageTutorTarget;
  onClose: () => void;
}

export default function MessageTutorModal({ tutor, onClose }: MessageTutorModalProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const sendRequest = useSendChatRequest();

  const name = tutor.name || 'this tutor';
  const firstName = name.split(' ')[0] || 'this tutor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sendRequest.isPending) return;
    try {
      const conversation = await sendRequest.mutateAsync({
        userId: tutor.id,
        note: note.trim() || undefined,
      });
      toast.success(`Chat request sent to ${firstName}.`);
      onClose();
      router.push(`/app/chat?conversationId=${conversation.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send chat request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Message Tutor</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            {tutor.photo ? (
              <img src={tutor.photo} alt={name} className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#001A72] to-[#001A72]/70 flex items-center justify-center text-white text-sm font-bold">
                {name
                  .split(' ')
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '??'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              {tutor.subject && <p className="text-[11px] text-gray-400 truncate">{tutor.subject}</p>}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3">
            <Lock size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              This sends a chat request. {firstName} must accept it before you can exchange messages.
            </p>
          </div>

          <div>
            <label htmlFor="chat-request-note" className="block text-xs font-medium text-gray-500 mb-1.5">
              Add a note (optional)
            </label>
            <textarea
              id="chat-request-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={`e.g. Hi ${firstName}, I'd like to ask about your ${tutor.subject || 'lessons'} and availability…`}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sendRequest.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#001A72] text-white text-sm font-medium rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
          >
            {sendRequest.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Send Request
                <Send size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
