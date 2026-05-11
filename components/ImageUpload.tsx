'use client';

import { useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  /** Local object URL for preview */
  preview: string | null;
  /** Called when the user picks a new file */
  onFileSelect: (file: File) => void;
  /** Called when the user clears the selection */
  onClear: () => void;
  /** Aspect ratio class — default 'aspect-video' (16:9) */
  aspectRatio?: string;
  /** Helper hint shown in the empty state */
  hint?: string;
  /** Label for the remove button */
  removeLabel?: string;
  /** Extra classes on the outer wrapper */
  className?: string;
  /** Disabled state (e.g. during upload at submit time) */
  disabled?: boolean;

  // ── Optional caption fields ──────────────────────────
  /** Show title + description inputs below the drop zone */
  showCaption?: boolean;
  /** Current title value */
  title?: string;
  /** Called when title changes */
  onTitleChange?: (value: string) => void;
  /** Placeholder for the title input */
  titlePlaceholder?: string;
  /** Current description value */
  description?: string;
  /** Called when description changes */
  onDescriptionChange?: (value: string) => void;
  /** Placeholder for the description textarea */
  descriptionPlaceholder?: string;
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition';
const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';

export default function ImageUpload({
  preview,
  onFileSelect,
  onClear,
  aspectRatio = 'aspect-video',
  hint = 'Recommended: 1280×720px (16:9)',
  removeLabel = 'Remove image',
  className = '',
  disabled = false,
  showCaption = false,
  title = '',
  onTitleChange,
  titlePlaceholder = 'Enter a title…',
  description = '',
  onDescriptionChange,
  descriptionPlaceholder = 'Add a short description…',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    // Reset so the same file can be re-selected after a clear
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* ── Drop zone ── */}
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden group transition ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-50'
            : preview
            ? 'border-transparent cursor-pointer'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer disabled:cursor-not-allowed"
        />

        {preview ? (
          <div className={`relative w-full ${aspectRatio}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={title || 'Preview'}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1.5 bg-white/90 text-[#001A72] text-[11px] font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon size={12} /> Click to change
              </div>
            </div>
          </div>
        ) : (
          <div className={`w-full ${aspectRatio} flex flex-col items-center justify-center p-6 text-center`}>
            <div className="w-12 h-12 rounded-full bg-[#001A72]/5 text-[#001A72] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ImageIcon size={24} />
            </div>
            <p className="text-sm font-bold text-gray-700">Click or drag to upload</p>
            <p className="text-xs text-gray-400 mt-1">{hint}</p>
          </div>
        )}
      </div>

      {/* Remove link */}
      {preview && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="-mt-1.5 flex items-center gap-1 self-start text-[10px] font-bold text-gray-400 hover:text-red-500 transition"
        >
          <X size={10} /> {removeLabel}
        </button>
      )}

      {/* ── Optional caption fields ── */}
      {showCaption && (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          {onTitleChange !== undefined && (
            <div>
              <label className={LABEL}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={titlePlaceholder}
                disabled={disabled}
                className={INPUT}
              />
            </div>
          )}
          {onDescriptionChange !== undefined && (
            <div>
              <label className={LABEL}>Description</label>
              <textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder={descriptionPlaceholder}
                disabled={disabled}
                rows={3}
                className={INPUT + ' resize-none'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
