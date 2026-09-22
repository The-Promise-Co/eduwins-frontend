'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
  Lock,
  MessageSquareText,
  Plus,
  Save,
  ShieldCheck,
  User,
  Users,
  Video,
  X,
  Loader2,
} from 'lucide-react';
import Button from '@/misc/components/Button';
import Modal from '@/misc/components/Modal';
import { useBooking, useEscrowBreakdown } from '@/misc/hooks/api/bookings';
import { useSavePersonalNotes, useSaveSharedNotes, useSessionNotes } from '@/misc/hooks/api/notes';
import { useUser } from '@/misc/context/UserContext';
import { Booking } from '@/misc/types';
import { NoteItem, StickyNoteColor, WhiteboardSnapshotItem } from '@/misc/types/session';
import { computeSessionTiming } from '@/misc/utils/sessionTiming';
import { formatTimeRange } from '@/misc/utils/time';
import { toast } from 'sonner';

function fullName(person?: { firstName?: string; lastName?: string } | null) {
  const name = `${person?.firstName || ''} ${person?.lastName || ''}`.trim();
  return name || 'Not provided';
}

const formatDate = (value?: string) => {
  if (!value) return 'Date pending';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatMoney = (value?: string | number) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString()}`;
};

const STICKY_COLORS: { color: StickyNoteColor; label: string; bgLight: string; borderLight: string; textLight: string }[] = [
  { color: 'yellow', label: 'Yellow', bgLight: 'bg-amber-50', borderLight: 'border-amber-200', textLight: 'text-amber-950' },
  { color: 'blue', label: 'Blue', bgLight: 'bg-blue-50', borderLight: 'border-blue-200', textLight: 'text-blue-950' },
  { color: 'green', label: 'Green', bgLight: 'bg-emerald-50', borderLight: 'border-emerald-200', textLight: 'text-emerald-950' },
  { color: 'pink', label: 'Pink', bgLight: 'bg-pink-50', borderLight: 'border-pink-200', textLight: 'text-pink-950' },
  { color: 'purple', label: 'Purple', bgLight: 'bg-purple-50', borderLight: 'border-purple-200', textLight: 'text-purple-950' },
];

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { user } = useUser();

  const bookingQuery = useBooking(bookingId);
  const notesQuery = useSessionNotes(bookingId);
  const savePersonalNotes = useSavePersonalNotes(bookingId);
  const saveSharedNotes = useSaveSharedNotes(bookingId);

  const booking = bookingQuery.data;
  const isTeacher = user?.role === 'teacher';

  const [activeTab, setActiveTab] = useState<'shared' | 'personal'>('shared');
  const [personalIndex, setPersonalIndex] = useState(0);
  const [sharedIndex, setSharedIndex] = useState(0);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedColor, setEditedColor] = useState<StickyNoteColor>('yellow');

  const [isCopied, setIsCopied] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<WhiteboardSnapshotItem | null>(null);

  const personalNotes = notesQuery.data?.personalNotes || [];
  const sharedNotes = notesQuery.data?.sharedNotes || [];
  const whiteboardSnapshots = notesQuery.data?.whiteboardSnapshots || [];

  const activeNotes = activeTab === 'shared' ? sharedNotes : personalNotes;
  const activeIndex = activeTab === 'shared' ? sharedIndex : personalIndex;
  const currentNote = activeNotes[activeIndex] || null;

  useEffect(() => {
    if (currentNote) {
      setEditedTitle(currentNote.title);
      setEditedContent(currentNote.content);
      setEditedColor(currentNote.color || 'yellow');
    }
  }, [currentNote]);

  const setIndex = (idx: number) => {
    setIsEditingNote(false);
    if (activeTab === 'shared') {
      setSharedIndex(Math.max(0, Math.min(idx, sharedNotes.length - 1)));
    } else {
      setPersonalIndex(Math.max(0, Math.min(idx, personalNotes.length - 1)));
    }
  };

  const handleAddNote = () => {
    const isShared = activeTab === 'shared';
    const newNote: NoteItem = {
      id: `${isShared ? 's' : 'p'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${isShared ? 'Shared Note' : 'Personal Note'} ${activeNotes.length + 1}`,
      content: '',
      color: isShared ? 'blue' : 'yellow',
      authorName: user ? fullName(user) : 'You',
      authorRole: isTeacher ? 'teacher' : 'parent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...activeNotes, newNote];
    if (isShared) {
      saveSharedNotes.mutate(updated);
      setSharedIndex(updated.length - 1);
    } else {
      savePersonalNotes.mutate(updated);
      setPersonalIndex(updated.length - 1);
    }
    setIsEditingNote(true);
    setEditedTitle(newNote.title);
    setEditedContent('');
    setEditedColor(newNote.color || 'yellow');
    toast.success(`Created ${newNote.title}`);
  };

  const handleSaveNoteEdit = () => {
    if (!currentNote) return;
    const isShared = activeTab === 'shared';
    const updatedNote: NoteItem = {
      ...currentNote,
      title: editedTitle.trim() || 'Untitled Note',
      content: editedContent,
      color: editedColor,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = activeNotes.map((n, i) => (i === activeIndex ? updatedNote : n));
    if (isShared) {
      saveSharedNotes.mutate(updatedList);
    } else {
      savePersonalNotes.mutate(updatedList);
    }
    setIsEditingNote(false);
    toast.success('Note saved');
  };

  const handleCopyNote = () => {
    if (!currentNote?.content.trim()) {
      toast.error('Note is empty');
      return;
    }
    navigator.clipboard.writeText(`${currentNote.title}\n\n${currentNote.content}`);
    setIsCopied(true);
    toast.success('Note copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadNote = () => {
    if (!currentNote?.content.trim()) {
      toast.error('Note is empty');
      return;
    }
    const blob = new Blob([`${currentNote.title}\n\n${currentNote.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentNote.title.toLowerCase().replace(/\s+/g, '-')}-${bookingId.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Note downloaded');
  };

  const handleDownloadAllNotes = () => {
    const isShared = activeTab === 'shared';
    const notesToExport = isShared ? sharedNotes : personalNotes;
    if (notesToExport.length === 0 || notesToExport.every((n) => !n.content.trim())) {
      toast.error('No notes available to download');
      return;
    }
    const output = notesToExport
      .map(
        (n, i) =>
          `=== ${n.title} (Page ${i + 1}) ===\nCreated: ${new Date(n.createdAt).toLocaleString()}\nUpdated: ${new Date(n.updatedAt).toLocaleString()}\nAuthor: ${n.authorName || 'Unknown'}\n\n${n.content}\n`
      )
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${activeTab}-notes-all-${bookingId.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('All notes downloaded');
  };

  const handleDownloadSnapshot = (snap: WhiteboardSnapshotItem) => {
    const blob = new Blob([snap.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snap.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Whiteboard snapshot downloaded');
  };

  if (bookingQuery.isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#001A72]" />
        <p className="text-xs font-bold text-gray-500">Loading booking details...</p>
      </div>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="space-y-6 pb-12">
        <button
          onClick={() => router.push('/app/booking-requests')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Bookings</span>
        </button>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
          <AlertCircle size={32} className="text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-red-900">Could not find booking</h2>
          <p className="text-xs text-red-600">The requested booking session does not exist or you do not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const colorConfig = currentNote ? STICKY_COLORS.find((c) => c.color === currentNote.color) || STICKY_COLORS[0] : STICKY_COLORS[0];
  const timing = computeSessionTiming(booking);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => router.push('/app/booking-requests')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to Bookings</span>
        </button>

        <div className="flex items-center gap-2">
          {timing.canJoin && (
            <Button
              fullWidth={false}
              onClick={() => router.push(`/app/session/${booking.id}`)}
              className="px-4 py-2 text-xs font-black bg-[#001A72]"
            >
              <Video size={14} /> Join Active Call
            </Button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#001A72] border border-blue-100">
            {booking.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column (2/5): Booking Summary & Details */}
        <div className="space-y-5 lg:col-span-2">
          {/* Main Info Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#001A72]/5 flex items-center justify-center text-[#001A72]">
                <BookOpen size={22} />
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900">{booking.subject || 'Tutoring Session'}</h1>
                <p className="text-xs text-gray-500">
                  {isTeacher ? `Requested by ${fullName(booking.parent)}` : `Tutor: ${fullName(booking.teacher)}`}
                </p>
              </div>
            </div>

            {/* Timings & Learners */}
            <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-600 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <Calendar size={14} className="text-[#001A72]" />
                <span className="font-semibold text-gray-800">{formatDate(booking.scheduledDate)}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <Clock size={14} className="text-[#001A72]" />
                <span className="font-semibold text-gray-800">
                  {formatTimeRange(booking.startTime, booking.endTime)} ({Number(booking.durationHours || 1)} hr)
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <Users size={14} className="text-[#001A72]" />
                <span className="font-semibold text-gray-800">
                  {booking.bookingFor === 'children'
                    ? booking.children?.map((c) => fullName(c)).join(', ') || 'Children'
                    : 'Parent learner'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <User size={14} className="text-[#001A72]" />
                <span className="font-bold text-[#001A72]">{formatMoney(booking.totalAmount ?? booking.totalCost)}</span>
              </div>
            </div>

            {/* Parent Note */}
            {booking.note && (
              <div className="rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 px-4 py-3 text-xs text-gray-700 space-y-1">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#001A72]">
                  <MessageSquareText size={13} /> Parent Note
                </p>
                <p className="leading-relaxed">{booking.note}</p>
              </div>
            )}
          </div>

          {/* Participants Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Participants</p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{fullName(booking.parent)}</p>
                  <p className="text-[10px] text-gray-500">Parent • {booking.parent?.email || 'No email'}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{fullName(booking.teacher)}</p>
                  <p className="text-[10px] text-gray-500">Tutor • {booking.teacher?.email || 'No email'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Escrow Status */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-3 text-xs">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Payment & Escrow</p>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Fee</span>
                <span className="font-black text-[#001A72] text-sm">{formatMoney(booking.totalAmount ?? booking.totalCost)}</span>
              </div>
              {booking.paymentReference && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono font-bold text-gray-700">{booking.paymentReference}</span>
                </div>
              )}
              {booking.paidAt && (
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Paid on</span>
                  <span className="font-semibold text-gray-700">{formatDateTime(booking.paidAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (3/5): Sticky Notes Viewer & Whiteboard Snapshots */}
        <div className="space-y-6 lg:col-span-3">
          {/* 1. STICKY NOTES SECTION */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            {/* Header & Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#001A72] text-white flex items-center justify-center shadow-sm">
                  <FileText size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">Session Sticky Notes</h2>
                  <p className="text-[10px] text-gray-400">Notes captured during or after the live session</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#001A72] text-white text-xs font-bold hover:bg-[#001A72]/90 transition shadow-sm"
                >
                  <Plus size={13} />
                  <span>New Note</span>
                </button>

                <button
                  onClick={handleDownloadAllNotes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                  title="Download all notes"
                >
                  <Download size={13} />
                  <span>Export All</span>
                </button>
              </div>
            </div>

            {/* Note Scope Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 border border-gray-200">
              <button
                onClick={() => {
                  setActiveTab('shared');
                  setIsEditingNote(false);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
                  activeTab === 'shared' ? 'bg-[#001A72] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users size={14} />
                <span>Shared Notes ({sharedNotes.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('personal');
                  setIsEditingNote(false);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition ${
                  activeTab === 'personal' ? 'bg-[#001A72] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock size={14} />
                <span>Personal Notes ({personalNotes.length})</span>
              </button>
            </div>

            {/* Sticky Note Pad Card */}
            {activeNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-3 bg-gray-50/50">
                <FileText size={32} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No {activeTab} notes recorded for this session yet.</p>
                <button
                  onClick={handleAddNote}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#001A72] text-white text-xs font-bold shadow-sm"
                >
                  <Plus size={14} /> Create First Note
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Page Navigation Top Ribbon */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIndex(activeIndex - 1)}
                      disabled={activeIndex <= 0}
                      className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition disabled:opacity-30 shadow-sm"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span className="text-xs font-black px-3 py-1 bg-gray-100 rounded-lg text-gray-700">
                      Page {activeIndex + 1} of {activeNotes.length}
                    </span>

                    <button
                      onClick={() => setIndex(activeIndex + 1)}
                      disabled={activeIndex >= activeNotes.length - 1}
                      className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition disabled:opacity-30 shadow-sm"
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Note Card Quick Tools */}
                  <div className="flex items-center gap-1.5">
                    {!isEditingNote ? (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
                      >
                        Edit Note
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveNoteEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                      >
                        <Save size={13} />
                        <span>Save</span>
                      </button>
                    )}

                    <button
                      onClick={handleCopyNote}
                      className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition shadow-sm"
                      title="Copy note text"
                    >
                      {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={handleDownloadNote}
                      className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition shadow-sm"
                      title="Download this note as file"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                {/* Sticky Note Visual Pad */}
                <div
                  className={`relative rounded-3xl border-2 p-6 shadow-md transition-all ${colorConfig.bgLight} ${colorConfig.borderLight}`}
                  style={{ minHeight: '260px' }}
                >
                  {/* Decorative tape sticker at top */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/60 backdrop-blur-md border border-black/10 rounded-sm shadow-sm rotate-[-1deg]" />

                  {isEditingNote ? (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          placeholder="Note Title..."
                          className="flex-1 text-sm font-black bg-transparent border-b border-black/20 pb-1 outline-none text-gray-900"
                        />
                        {/* Color Picker */}
                        <div className="flex items-center gap-1">
                          {STICKY_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setEditedColor(c.color)}
                              className={`w-4 h-4 rounded-full border ${
                                editedColor === c.color ? 'ring-2 ring-[#001A72] scale-110' : 'opacity-60'
                              } ${
                                c.color === 'yellow'
                                  ? 'bg-amber-300 border-amber-400'
                                  : c.color === 'blue'
                                  ? 'bg-blue-300 border-blue-400'
                                  : c.color === 'green'
                                  ? 'bg-emerald-300 border-emerald-400'
                                  : c.color === 'pink'
                                  ? 'bg-pink-300 border-pink-400'
                                  : 'bg-purple-300 border-purple-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Write your note content here..."
                        rows={10}
                        className="w-full bg-transparent text-xs text-gray-900 resize-none outline-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-black/10 pb-2">
                        <h3 className="text-sm font-black text-gray-900">{currentNote?.title || 'Note'}</h3>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {currentNote ? new Date(currentNote.updatedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                        {currentNote?.content?.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>|<\/li>|<\/div>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') || <span className="italic text-gray-400">Empty note page...</span>}
                      </p>
                      {currentNote?.authorName && (
                        <div className="pt-2 text-[10px] text-gray-400 font-semibold text-right">
                          By: {currentNote.authorName} ({currentNote.authorRole || 'participant'})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. WHITEBOARD SNAPSHOTS GALLERY */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Camera size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">Whiteboard Snapshots</h2>
                  <p className="text-[10px] text-gray-400">Timestamped board snapshots taken during this session</p>
                </div>
              </div>

              <span className="text-xs font-black text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                {whiteboardSnapshots.length} snapshot{whiteboardSnapshots.length === 1 ? '' : 's'}
              </span>
            </div>

            {whiteboardSnapshots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center space-y-2 bg-gray-50/50">
                <Camera size={32} className="text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-500">No whiteboard snapshots were saved during this session.</p>
                <p className="text-[11px] text-gray-400">
                  During live sessions, click &quot;Take Snapshot&quot; on the whiteboard to save timestamped images here.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {whiteboardSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="group rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 hover:shadow-md transition flex flex-col"
                  >
                    {/* SVG Image Preview Container */}
                    <div
                      className="h-44 w-full bg-white border-b border-gray-100 p-2 overflow-hidden flex items-center justify-center relative cursor-pointer"
                      onClick={() => setPreviewSnapshot(snap)}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center scale-90 transition group-hover:scale-95"
                        dangerouslySetInnerHTML={{ __html: snap.svg }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="px-3 py-1.5 rounded-xl bg-black/75 text-white text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                          <Eye size={13} /> View Full
                        </span>
                      </div>
                    </div>

                    {/* Snapshot Metadata & Tools */}
                    <div className="p-3.5 flex items-center justify-between gap-2 bg-white">
                      <div>
                        <p className="text-xs font-black text-gray-900 truncate">{snap.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {snap.timestamp} {snap.authorName ? `• ${snap.authorName}` : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition shadow-sm shrink-0"
                        title="Download SVG image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      <Modal
        isOpen={!!previewSnapshot}
        onClose={() => setPreviewSnapshot(null)}
        title={previewSnapshot?.title || 'Whiteboard Snapshot'}
        subtitle={`Captured at ${previewSnapshot?.timestamp || ''}${previewSnapshot?.authorName ? ` by ${previewSnapshot.authorName}` : ''}`}
        size="lg"
        footer={
          <div className="w-full flex items-center justify-between">
            <button
              type="button"
              onClick={() => previewSnapshot && handleDownloadSnapshot(previewSnapshot)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Download size={14} />
              <span>Download Image</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewSnapshot(null)}
              className="rounded-xl bg-[#001A72] px-5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition"
            >
              Close
            </button>
          </div>
        }
      >
        {previewSnapshot && (
          <div className="w-full min-h-[350px] max-h-[70vh] bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-center overflow-auto">
            <div
              className="w-full h-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: previewSnapshot.svg }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
