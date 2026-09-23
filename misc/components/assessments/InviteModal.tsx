'use client';

import { useState } from 'react';
import { Mail, X, Loader2, Send, User } from 'lucide-react';
import Modal from '@/misc/components/Modal';
import { useLookupAssignee, useInviteToAssessment } from '@/misc/hooks/api/assessments';
import { toast } from 'sonner';

interface InviteModalProps {
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ assessmentId, isOpen, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [dueAt, setDueAt] = useState('');
  const { data: found, isFetching: looking } = useLookupAssignee(email.trim());
  const invite = useInviteToAssessment(assessmentId);

  const handleSend = async () => {
    if (!found) return;
    try {
      await invite.mutateAsync({
        assigneeType: found.kind,
        assigneeId: found.id,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      toast.success(`Assessment sent to ${found.name}`);
      setEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to send invite');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send assessment"
      subtitle="Look up any parent or child by email — they get it immediately"
      size="md"
    >
      <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient email</label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
        />
      </div>

      <label className="block text-xs font-medium text-gray-500 mt-4 mb-1.5">
        Due date <span className="text-gray-300">(optional)</span>
      </label>
      <input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
      />

      <div className="mt-4">
        {looking && (
          <div className="flex items-center gap-3 py-4 justify-center">
            <Loader2 size={18} className="animate-spin text-[#001A72]" />
            <span className="text-xs text-gray-400">Looking up user...</span>
          </div>
        )}
        {!looking && found && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#001A72]/10 flex items-center justify-center text-[#001A72]">
                <User size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{found.name}</p>
                <p className="text-[11px] text-gray-400">{found.email}</p>
                <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#001A72]/5 text-[#001A72]">
                  {found.kind}
                </span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={invite.isPending}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#001A72] text-white text-sm font-bold rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
            >
              {invite.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {invite.isPending ? 'Sending...' : 'Send assessment'}
            </button>
          </div>
        )}
        {!looking && !found && email.includes('@') && (
          <p className="text-center text-xs text-gray-400 py-4">No parent or child found with that email</p>
        )}
        {!email.includes('@') && (
          <p className="text-center text-xs text-gray-400 py-4">Enter an email to find a parent or child</p>
        )}
      </div>
    </Modal>
  );
}

export function InviteModalTriggerX() {
  return <X size={18} />;
}
