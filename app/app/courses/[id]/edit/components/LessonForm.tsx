'use client';

import { useRef, useState } from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { X, Video, FileText, Upload, Loader2, Play, Pause } from 'lucide-react';
import Editor from '@/misc/components/Editor';

export type LessonDraft = {
  title: string;
  type: 'video' | 'article';
  video_url: string;
  duration_seconds: number;
  content: string;
  is_preview: boolean;
};

interface LessonFormProps {
  register: UseFormRegister<LessonDraft>;
  setValue: UseFormSetValue<LessonDraft>;
  draft: LessonDraft;
  setField: (k: keyof LessonDraft, v: any) => void;
  videoFileName: string | null;
  videoPreviewUrl: string | null;
  isUploadingVideo: boolean;
  uploadProgress: number;
  uploadError: string | null;
  handleVideoUpload: (file: File) => Promise<void>;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  isEdit: boolean;
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none transition';
const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';

export default function LessonForm({
  register,
  setValue,
  draft,
  videoFileName,
  videoPreviewUrl,
  isUploadingVideo,
  uploadProgress,
  uploadError,
  handleVideoUpload,
  onSave,
  onCancel,
  isSaving,
  isEdit,
}: LessonFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="border-t border-[#001A72]/10 p-6 space-y-5 bg-[#001A72]/[0.02]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[#001A72] uppercase tracking-widest">
          {isEdit ? 'Edit Lesson' : 'New Lesson'}
        </h3>
        <button onClick={onCancel} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition flex items-center gap-1">
          <X size={12} /> Cancel
        </button>
      </div>

      {/* Title + type */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Lesson Title</label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Introduction to Derivatives"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Content Type</label>
          <div className="flex gap-2">
            {(['video', 'article'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${draft.type === t
                  ? 'bg-[#001A72] text-white border-[#001A72]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {t === 'video' ? <Video size={13} /> : <FileText size={13} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Video / Article */}
      {draft.type === 'video' ? (
        <div>
          <label className={LABEL}>Lesson Video</label>
          {(draft.video_url || videoPreviewUrl) ? (
            <div className="space-y-4">
              {/* Premium video player preview */}
              {videoPreviewUrl && (
                <div className="group relative block w-full overflow-hidden rounded-2xl border border-gray-100 bg-black shadow-md">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    aria-label="Click to change video"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleVideoUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    preload="metadata"
                    className="block h-[360px] max-h-[55vw] min-h-[220px] w-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    type="button"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                    title={isPlaying ? 'Pause video' : 'Play video'}
                    className="absolute left-1/2 top-1/2 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#001A72] shadow-lg transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB81C]"
                    onClick={() => {
                      const video = videoRef.current;
                      if (!video) return;

                      if (video.paused) {
                        void video.play().catch(() => setIsPlaying(false));
                      } else {
                        video.pause();
                      }
                    }}
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                  </button>
                  <button
                    type="button"
                    className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-[#001A72] opacity-0 shadow-md transition hover:bg-white focus:opacity-100 group-hover:opacity-100"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload size={14} /> Click to change video
                  </button>
                </div>
              )}

              <label className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-3 cursor-pointer transition hover:border-emerald-400 focus-within:ring-2 focus-within:ring-[#001A72]/20">
                <input
                  type="file"
                  accept="video/*"
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label="Click to change video"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handleVideoUpload(file);
                    e.target.value = '';
                  }}
                />
                <Video size={18} className="shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-emerald-800">
                    {videoFileName || (draft.video_url ? 'Saved Video' : 'Selected Video')}
                  </p>
                  {draft.duration_seconds > 0 && (
                    <p className="text-[10px] text-emerald-600">{Math.round(draft.duration_seconds / 60)} min detected</p>
                  )}
                  {videoPreviewUrl && videoPreviewUrl.startsWith('blob:') && (
                    <p className="mt-0.5 text-[10px] font-semibold text-amber-600">⚠️ Unsaved changes (Click Save to upload)</p>
                  )}
                </div>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#001A72]/85 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  Click to change video
                </span>
              </label>
            </div>
          ) : (
            <label className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition border-gray-200 bg-white hover:bg-gray-50 hover:border-[#001A72]/30`}>
              <input
                type="file"
                accept="video/*"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await handleVideoUpload(file);
                }}
              />
              <>
                <Upload size={22} className="text-gray-400" />
                <span className="text-sm font-bold text-gray-600">Click to select video</span>
                <span className="text-xs text-gray-400">MP4, MOV, WebM (Max 500MB)</span>
              </>
            </label>
          )}

          {/* R2 upload progress indicator shown only during active saving/uploading */}
          {isSaving && isUploadingVideo && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-600 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Uploading video…
                </span>
                <span className="text-xs font-black text-amber-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
              <X size={12} className="shrink-0" /> {uploadError}
            </p>
          )}
        </div>
      ) : (
        <div>
          <label className={LABEL}>Article Content</label>
          <Editor content={draft.content} onChange={html => setValue('content', html)} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('is_preview')}
            className="rounded border-gray-300 text-[#001A72]"
          />
          Free preview (visible to non-enrolled students)
        </label>
        <button
          onClick={onSave}
          disabled={isSaving || !draft.title.trim()}
          className="flex items-center gap-2 bg-[#001A72] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition shadow-md disabled:opacity-50"
        >
          {isSaving
            ? <><Loader2 size={14} className="animate-spin" /> {isUploadingVideo ? 'Uploading…' : 'Saving…'}</>
            : isEdit ? 'Save Changes' : 'Add Lesson'}
        </button>
      </div>
    </div>
  );
}
