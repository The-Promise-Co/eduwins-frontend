'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, ChevronLeft, ChevronRight, Copy, Download, FileText, Italic, List, ListOrdered, Lock, Plus, Trash2, Underline as UnderlineIcon, Users, X, Check, Save } from 'lucide-react';
import { NoteItem, StickyNoteColor } from '@/misc/types/session';
import { toast } from 'sonner';

interface SessionNotesSidebarProps {
  personalNotes: NoteItem[];
  sharedNotes: NoteItem[];
  onSavePersonalNotes: (notes: NoteItem[]) => Promise<void>;
  onSaveSharedNotes: (notes: NoteItem[]) => Promise<void>;
  onBroadcastSharedNotes?: (notes: NoteItem[]) => void;
  participantRole: 'parent' | 'teacher' | 'child';
  participantName?: string;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const STICKY_COLORS: { color: StickyNoteColor; label: string; bgLight: string; bgDark: string; borderLight: string; borderDark: string }[] = [
  { color: 'yellow', label: 'Yellow', bgLight: 'bg-amber-50', bgDark: 'bg-amber-950/40', borderLight: 'border-amber-200', borderDark: 'border-amber-800' },
  { color: 'blue', label: 'Blue', bgLight: 'bg-blue-50', bgDark: 'bg-blue-950/40', borderLight: 'border-blue-200', borderDark: 'border-blue-800' },
  { color: 'green', label: 'Green', bgLight: 'bg-emerald-50', bgDark: 'bg-emerald-950/40', borderLight: 'border-emerald-200', borderDark: 'border-emerald-800' },
  { color: 'pink', label: 'Pink', bgLight: 'bg-pink-50', bgDark: 'bg-pink-950/40', borderLight: 'border-pink-200', borderDark: 'border-pink-800' },
  { color: 'purple', label: 'Purple', bgLight: 'bg-purple-50', bgDark: 'bg-purple-950/40', borderLight: 'border-purple-200', borderDark: 'border-purple-800' },
];

function RichTextEditor({ content, onChange, isDark }: { content: string; onChange: (content: string) => void; isDark: boolean }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content,
    editorProps: {
      attributes: {
        class: `h-full min-h-[180px] outline-none text-xs leading-relaxed ${isDark ? 'text-gray-100' : 'text-gray-900'} [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) editor.commands.setContent(content || '', { emitUpdate: false });
  }, [content, editor]);

  if (!editor) return null;
  const controls = [
    { label: 'Bold', icon: Bold, active: editor.isActive('bold'), action: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: editor.isActive('italic'), action: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: UnderlineIcon, active: editor.isActive('underline'), action: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Bulleted list', icon: List, active: editor.isActive('bulletList'), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: ListOrdered, active: editor.isActive('orderedList'), action: () => editor.chain().focus().toggleOrderedList().run() },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center gap-1 border-b border-black/10 pb-2">
        {controls.map(({ label, icon: Icon, active, action }) => (
          <button key={label} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={action}
            className={`flex h-7 w-7 items-center justify-center rounded transition ${active ? 'bg-[#001A72] text-white' : isDark ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'}`}>
            <Icon size={14} />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />
    </div>
  );
}

export default function SessionNotesSidebar({
  personalNotes,
  sharedNotes,
  onSavePersonalNotes,
  onSaveSharedNotes,
  onBroadcastSharedNotes,
  participantRole,
  participantName,
  theme,
  onClose,
}: SessionNotesSidebarProps) {
  const [activeTab, setActiveTab] = useState<'shared' | 'personal'>('shared');
  const [localPersonal, setLocalPersonal] = useState<NoteItem[]>(personalNotes);
  const [localShared, setLocalShared] = useState<NoteItem[]>(sharedNotes);

  const [personalIndex, setPersonalIndex] = useState(0);
  const [sharedIndex, setSharedIndex] = useState(0);

  const [isCopied, setIsCopied] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  const personalDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const sharedDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const persistWithErrorHandling = useCallback(
    async (isShared: boolean, notes: NoteItem[]) => {
      setSavedStatus('saving');
      setSaveError(null);
      try {
        if (isShared) {
          await onSaveSharedNotes(notes);
          onBroadcastSharedNotes?.(notes);
        } else {
          await onSavePersonalNotes(notes);
        }
        setSavedStatus('saved');
      } catch {
        // Keep the note visible; flag it unsaved and toast with retry.
        setSavedStatus('error');
        setSaveError('Notes not saved');
        toast.error('Notes not saved — server save failed.', {
          action: { label: 'Retry', onClick: () => void persistWithErrorHandling(isShared, notes) },
        });
      }
    },
    [onSavePersonalNotes, onSaveSharedNotes, onBroadcastSharedNotes],
  );

  // Sync DB truth into local state on every remount / refetch. Empty from the
  // DB stays empty (no phantom blank note); the editor shows an empty state.
  useEffect(() => {
    setLocalPersonal(personalNotes);
    setPersonalIndex((prev) => Math.max(0, Math.min(prev, Math.max(0, personalNotes.length - 1))));
  }, [personalNotes]);

  useEffect(() => {
    setLocalShared(sharedNotes);
    setSharedIndex((prev) => Math.max(0, Math.min(prev, Math.max(0, sharedNotes.length - 1))));
  }, [sharedNotes]);

  const activeNotes = activeTab === 'shared' ? localShared : localPersonal;
  const activeIndex = activeTab === 'shared' ? sharedIndex : personalIndex;
  const currentNote: NoteItem | null = activeNotes[activeIndex] || activeNotes[0] || null;

  // Safe index setters
  const setIndex = (idx: number) => {
    if (activeTab === 'shared') {
      setSharedIndex(Math.max(0, Math.min(idx, Math.max(0, localShared.length - 1))));
    } else {
      setPersonalIndex(Math.max(0, Math.min(idx, Math.max(0, localPersonal.length - 1))));
    }
  };

  // Add new note — every note is PUT to the DB; failure keeps it visible with retry.
  const handleAddNote = () => {
    const isShared = activeTab === 'shared';
    const newNote: NoteItem = {
      id: `${isShared ? 's' : 'p'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${isShared ? 'Shared Note' : 'Personal Note'} ${activeNotes.length + 1}`,
      content: '',
      color: isShared ? 'blue' : 'yellow',
      authorName: participantName,
      authorRole: participantRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...activeNotes, newNote];
    if (isShared) {
      setLocalShared(updated);
      setSharedIndex(updated.length - 1);
    } else {
      setLocalPersonal(updated);
      setPersonalIndex(updated.length - 1);
    }
    void persistWithErrorHandling(isShared, updated).then(() => {
      if (savedStatus !== 'error') toast.success(`Added ${newNote.title}`);
    });
  };

  // Delete current note
  const handleDeleteNote = () => {
    if (!currentNote) return;
    const isShared = activeTab === 'shared';
    const updated = activeNotes.filter((_, i) => i !== activeIndex);
    const nextIdx = Math.max(0, activeIndex - 1);

    if (isShared) {
      setLocalShared(updated);
      setSharedIndex(nextIdx);
    } else {
      setLocalPersonal(updated);
      setPersonalIndex(nextIdx);
    }
    void persistWithErrorHandling(isShared, updated).then(() => {
      if (savedStatus !== 'error') toast.success('Note deleted');
    });
  };

  // Update current note fields
  const handleUpdateCurrentNote = (updates: Partial<NoteItem>) => {
    if (!currentNote) return;
    const isShared = activeTab === 'shared';
    const updatedList = activeNotes.map((note, i) =>
      i === activeIndex
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );

    setSavedStatus('saving');
    setSaveError(null);

    if (isShared) {
      setLocalShared(updatedList);
      if (sharedDebounceRef.current) clearTimeout(sharedDebounceRef.current);
      sharedDebounceRef.current = setTimeout(() => {
        void persistWithErrorHandling(true, updatedList);
      }, 1500);
    } else {
      setLocalPersonal(updatedList);
      if (personalDebounceRef.current) clearTimeout(personalDebounceRef.current);
      personalDebounceRef.current = setTimeout(() => {
        void persistWithErrorHandling(false, updatedList);
      }, 1500);
    }
  };

  // Copy note to clipboard
  const handleCopy = () => {
    if (!currentNote || !currentNote.content.trim()) {
      toast.error('Current note is empty');
      return;
    }
    const textToCopy = `${currentNote.title}\n\n${currentNote.content}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success('Note copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download all notes as .txt file
  const handleDownloadAll = () => {
    const isShared = activeTab === 'shared';
    const notesToExport = isShared ? localShared : localPersonal;
    if (notesToExport.length === 0 || notesToExport.every((n) => !n.content.trim())) {
      toast.error('Notes are empty');
      return;
    }

    const output = notesToExport
      .map((n, i) => `=== ${n.title} (Page ${i + 1}) ===\nLast updated: ${new Date(n.updatedAt).toLocaleString()}\n\n${n.content}\n`)
      .join('\n----------------------------------------\n\n');

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${activeTab}-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('All notes downloaded');
  };

  const isDark = theme === 'dark';
  const colorConfig = STICKY_COLORS.find((c) => c.color === currentNote?.color) || STICKY_COLORS[0];

  return (
    <aside
      className={`w-80 md:w-96 shrink-0 border-r flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#001A72] text-white flex items-center justify-center shadow-sm">
            <FileText size={15} />
          </div>
          <div>
            <span className="text-sm font-bold block leading-tight">Session Notes</span>
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {savedStatus === 'saving' ? 'Saving changes...' : savedStatus === 'error' ? 'Save failed — kept on screen' : 'All changes saved'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
            isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
          aria-label="Close notes"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className={`px-4 pt-3 pb-2 border-b shrink-0 ${isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-100 bg-gray-50/50'}`}>
        <div className={`grid grid-cols-2 p-1 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              activeTab === 'shared'
                ? 'bg-[#001A72] text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users size={13} />
            <span>Shared ({localShared.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
              activeTab === 'personal'
                ? 'bg-[#001A72] text-white shadow-sm'
                : isDark
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock size={13} />
            <span>Personal ({localPersonal.length})</span>
          </button>
        </div>

        {/* Note Page Switcher & Controls */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex(activeIndex - 1)}
              disabled={activeIndex <= 0}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold transition disabled:opacity-30 ${
                isDark ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 text-white' : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
              }`}
              title="Previous Note"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="text-xs font-black px-2 min-w-[70px] text-center">
              {activeNotes.length === 0 ? 'Page 0 of 0' : `Page ${activeIndex + 1} of ${activeNotes.length}`}
            </span>

            <button
              onClick={() => setIndex(activeIndex + 1)}
              disabled={activeIndex >= activeNotes.length - 1}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-bold transition disabled:opacity-30 ${
                isDark ? 'border-gray-800 bg-gray-900 hover:bg-gray-800 text-white' : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 shadow-sm'
              }`}
              title="Next Note"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Add & Delete Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAddNote}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
                isDark ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500' : 'bg-[#001A72] border-[#001A72] text-white hover:bg-[#001A72]/90'
              }`}
              title="Add a new note page"
            >
              <Plus size={13} />
              <span>New Note</span>
            </button>

            {activeNotes.length >= 1 && currentNote && (
              <button
                onClick={handleDeleteNote}
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                title="Delete this note"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Sticky Note Area */}
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        {saveError && (
          <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700 flex items-center justify-between gap-2">
            <span>{saveError}</span>
            <button
              type="button"
              onClick={() => void persistWithErrorHandling(activeTab === 'shared', activeNotes)}
              className="shrink-0 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-red-500 transition"
            >
              Retry
            </button>
          </div>
        )}
        {!currentNote ? (
          <div className="flex-1 rounded-2xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center gap-2">
            <FileText size={20} className="text-gray-400" />
            <p className="text-xs font-bold text-gray-600">No {activeTab} notes yet</p>
            <p className="text-[11px] text-gray-400">Notes load on open. Create the first one to get started.</p>
            <button
              type="button"
              onClick={handleAddNote}
              className="mt-1 flex items-center gap-1 px-3 py-2 rounded-lg bg-[#001A72] text-white text-xs font-bold hover:bg-[#001A72]/90 transition"
            >
              <Plus size={13} />
              <span>New Note</span>
            </button>
          </div>
        ) : (
        <div
          className={`flex-1 rounded-2xl border p-3.5 flex flex-col transition-colors shadow-sm ${
            isDark ? `${colorConfig.bgDark} ${colorConfig.borderDark}` : `${colorConfig.bgLight} ${colorConfig.borderLight}`
          }`}
        >
          {/* Note Title & Color Selector */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/10 dark:border-white/10">
            <input
              type="text"
              value={currentNote.title}
              onChange={(e) => handleUpdateCurrentNote({ title: e.target.value })}
              placeholder="Note title..."
              className={`flex-1 bg-transparent font-black text-xs outline-none placeholder:text-gray-400 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            />

            {/* Color circles */}
            <div className="flex items-center gap-1">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => handleUpdateCurrentNote({ color: c.color })}
                  className={`w-3.5 h-3.5 rounded-full border transition ${
                    currentNote.color === c.color ? 'ring-2 ring-[#001A72] scale-110' : 'opacity-70 hover:opacity-100'
                  } ${
                    c.color === 'yellow'
                      ? 'bg-amber-300 border-amber-400'
                      : c.color === 'blue'
                      ? 'bg-blue-400 border-blue-500'
                      : c.color === 'green'
                      ? 'bg-emerald-400 border-emerald-500'
                      : c.color === 'pink'
                      ? 'bg-pink-400 border-pink-500'
                      : 'bg-purple-400 border-purple-500'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <RichTextEditor
            key={currentNote.id}
            content={currentNote.content}
            onChange={(content) => handleUpdateCurrentNote({ content })}
            isDark={isDark}
          />
        </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className={`p-3 border-t flex items-center justify-between gap-2 shrink-0 ${isDark ? 'border-gray-800 bg-gray-950/60' : 'border-gray-100 bg-gray-50/70'}`}>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Save size={12} className={savedStatus === 'error' ? 'text-red-500' : 'text-emerald-500'} />
          <span>{savedStatus === 'saving' ? 'Saving...' : savedStatus === 'error' ? 'Not saved' : 'Saved'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
            title="Copy current note"
          >
            {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
              isDark
                ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
            title="Download all notes as .txt file"
          >
            <Download size={12} />
            <span>Download All</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
