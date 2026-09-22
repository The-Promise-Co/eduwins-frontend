'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, FileText, Lock, Save, Users, X } from 'lucide-react';
import Modal from '@/misc/components/Modal';
import { useSavePersonalNotes, useSaveSharedNotes, useSessionNotes } from '@/misc/hooks/api/notes';
import { NoteItem } from '@/misc/types/session';
import { toast } from 'sonner';

interface SessionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingSubject?: string;
  partnerName?: string;
  scheduledDate?: string;
  participantRole: 'parent' | 'teacher' | 'child';
}

/** Extract a single plaintext string from a NoteItem array (uses first note's content) */
function notesToText(notes: NoteItem[]): string {
  if (!notes || notes.length === 0) return '';
  const toPlainText = (content: string) => content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ');
  return notes.map((n) => (n.title ? `${n.title}\n\n${toPlainText(n.content)}` : toPlainText(n.content))).join('\n\n---\n\n');
}

/** Wrap a plaintext string back into a single NoteItem for saving */
function textToNotes(text: string, existingNotes: NoteItem[], role: 'parent' | 'teacher' | 'child'): NoteItem[] {
  if (existingNotes.length > 0) {
    // Update the first note's content, preserve others
    return existingNotes.map((n, i) => (i === 0 ? { ...n, content: text, updatedAt: new Date().toISOString() } : n));
  }
  return [
    {
      id: 'note-1',
      title: role === 'teacher' ? 'Session Notes' : 'My Notes',
      content: text,
      color: role === 'teacher' ? 'blue' : 'yellow',
      authorRole: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export default function SessionNotesModal({
  isOpen,
  onClose,
  bookingId,
  bookingSubject,
  partnerName,
  scheduledDate,
  participantRole,
}: SessionNotesModalProps) {
  const { data: notes, isLoading } = useSessionNotes(isOpen ? bookingId : undefined);
  const savePersonalMutation = useSavePersonalNotes(bookingId);
  const saveSharedMutation = useSaveSharedNotes(bookingId);

  const [activeTab, setActiveTab] = useState<'shared' | 'personal'>('shared');
  const [personalContent, setPersonalContent] = useState('');
  const [sharedContent, setSharedContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const personalDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const sharedDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync notes from query into local string state
  useEffect(() => {
    if (notes) {
      setPersonalContent(notesToText(notes.personalNotes));
      setSharedContent(notesToText(notes.sharedNotes));
    }
  }, [notes]);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPersonalContent(value);
    setSaveStatus('saving');

    if (personalDebounceRef.current) clearTimeout(personalDebounceRef.current);
    personalDebounceRef.current = setTimeout(() => {
      const updated = textToNotes(value, notes?.personalNotes || [], participantRole);
      savePersonalMutation.mutate(updated);
      setSaveStatus('saved');
    }, 500);
  };

  const handleSharedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSharedContent(value);
    setSaveStatus('saving');

    if (sharedDebounceRef.current) clearTimeout(sharedDebounceRef.current);
    sharedDebounceRef.current = setTimeout(() => {
      const updated = textToNotes(value, notes?.sharedNotes || [], participantRole);
      saveSharedMutation.mutate(updated);
      setSaveStatus('saved');
    }, 500);
  };

  const handleCopy = () => {
    const content = activeTab === 'shared' ? sharedContent : personalContent;
    if (!content.trim()) {
      toast.error('Note is empty');
      return;
    }
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success(`${activeTab === 'shared' ? 'Shared' : 'Personal'} notes copied!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = activeTab === 'shared' ? sharedContent : personalContent;
    if (!content.trim()) {
      toast.error('Note is empty');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${activeTab}-notes-${bookingId.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Notes downloaded');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session Notes"
      subtitle={`${bookingSubject || 'Tutoring Session'}${partnerName ? ` with ${partnerName}` : ''}${scheduledDate ? ` • ${scheduledDate}` : ''}`}
      size="lg"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Save size={13} className="text-emerald-500" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'All changes saved'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{isCopied ? 'Copied' : 'Copy Note'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Download size={13} />
              <span>Download .txt</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#001A72] px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition"
            >
              Done
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('shared')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
              activeTab === 'shared'
                ? 'bg-[#001A72] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={14} />
            <span>Shared Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
              activeTab === 'personal'
                ? 'bg-[#001A72] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock size={14} />
            <span>Personal Notes ({participantRole === 'teacher' ? 'Tutor Only' : 'Private'})</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-[11px] text-gray-600 flex items-center justify-between">
          <span>
            {activeTab === 'shared'
              ? '👥 Shared notes are accessible by all participants in this booking.'
              : '🔒 Personal notes are strictly private to your account.'}
          </span>
        </div>

        {/* Textarea editor */}
        <div className="min-h-[260px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
              Loading notes...
            </div>
          ) : activeTab === 'shared' ? (
            <textarea
              value={sharedContent}
              onChange={handleSharedChange}
              placeholder="Shared notes, key takeaways, homework assignments, or lesson goals..."
              rows={12}
              className="w-full flex-1 p-4 rounded-2xl border border-gray-200 bg-white text-xs text-gray-900 placeholder-gray-400 outline-none leading-relaxed resize-none focus:border-[#001A72] focus:ring-4 focus:ring-[#001A72]/10 transition"
            />
          ) : (
            <textarea
              value={personalContent}
              onChange={handlePersonalChange}
              placeholder="Your private thoughts, reminders, student evaluations, or session notes..."
              rows={12}
              className="w-full flex-1 p-4 rounded-2xl border border-gray-200 bg-white text-xs text-gray-900 placeholder-gray-400 outline-none leading-relaxed resize-none focus:border-[#001A72] focus:ring-4 focus:ring-[#001A72]/10 transition"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
