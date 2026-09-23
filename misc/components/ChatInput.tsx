'use client';

import { useState, useRef } from 'react';
import { Send, Image, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { useR2 } from '@/misc/hooks/useR2';

interface ChatInputProps {
  onSend: (content: string, type?: string, attachmentUrl?: string) => boolean | void;
  onTyping: () => void;
}

export default function ChatInput({ onSend, onTyping }: ChatInputProps) {
  const [text, setText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useR2();

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;

    if (pendingFile) {
      setUploading(true);
      try {
        // Upload to R2 via presigned URL (same pipeline as whiteboard snapshots)
        const url = await uploadFile(pendingFile, 'chat');
        if (!url) throw new Error('Upload failed');
        const isImage = pendingFile.type.startsWith('image/');
        const sent = onSend(trimmed || (isImage ? 'Image' : pendingFile.name), isImage ? 'image' : 'file', url);
        // Keep the pending file so the user can retry if sending failed
        if (sent === false) return;
      } catch {
        toast.error('Failed to upload file');
        return;
      } finally {
        setUploading(false);
      }
      setPendingFile(null);
      setPreviewUrl(null);
    } else {
      // Keep the draft so the user can retry if sending failed
      if (onSend(trimmed) === false) return;
    }

    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    e.target.value = '';
  };

  const cancelPending = () => {
    setPendingFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
      {/* Pending file preview */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Paperclip size={18} className="text-gray-400" />
            </div>
          )}
          <p className="text-xs text-gray-600 truncate flex-1">{pendingFile.name}</p>
          <button onClick={cancelPending} className="p-1 rounded hover:bg-gray-100">
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachment buttons */}
        <div className="flex gap-1 pb-1">
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
            title="Send image"
          >
            <Image size={18} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500"
            title="Send file"
          >
            <Paperclip size={18} />
          </button>
        </div>

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none border border-gray-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] bg-white max-h-32"
          style={{ minHeight: '42px' }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={uploading || (!text.trim() && !pendingFile)}
          className="p-2.5 bg-[#001A72] text-white rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
