'use client';

import { AlertTriangle, Download, FileText } from 'lucide-react';
import type { Message } from '@/misc/types/chat';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export default function ChatMessage({ message, isOwn, showAvatar }: ChatMessageProps) {
  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}>
      <div
        className={`max-w-[80%] ${
          message.type === 'image'
            ? 'p-1'
            : message.type === 'file'
            ? 'px-4 py-3'
            : 'px-4 py-2.5'
        } rounded-2xl text-sm ${
          isOwn
            ? 'bg-[#001A72] text-white rounded-tr-none'
            : message.flagged
            ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-none'
            : 'bg-gray-100 text-gray-900 rounded-tl-none'
        }`}
      >
        {/* Image message */}
        {message.type === 'image' && message.attachmentUrl && (
          <img
            src={message.attachmentUrl}
            alt="Shared image"
            className="rounded-xl max-w-full max-h-64 object-cover"
          />
        )}

        {/* File message */}
        {message.type === 'file' && message.attachmentUrl && (
          <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isOwn ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{message.content || 'File'}</p>
              <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>Click to download</p>
            </div>
            <Download size={14} className={isOwn ? 'text-white/60' : 'text-gray-400'} />
          </a>
        )}

        {/* Text content */}
        {message.type === 'text' && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

        {/* Flagged warning */}
        {message.flagged && (
          <p className={`text-[10px] mt-1 font-black uppercase tracking-widest flex items-center gap-1 ${
            isOwn ? 'text-amber-200' : 'text-amber-600'
          }`}>
            <AlertTriangle size={10} /> {message.flaggedReason || 'Flagged'}
          </p>
        )}

        {/* Time */}
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/50' : 'text-gray-400'} text-right`}>
          {time}
        </p>
      </div>
    </div>
  );
}
