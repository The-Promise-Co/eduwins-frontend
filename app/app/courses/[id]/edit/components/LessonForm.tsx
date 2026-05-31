'use client';

import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { X, Video, FileText, Upload, Loader2 } from 'lucide-react';
import Editor from '@/components/Editor';

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
  onClearVideo: () => void;
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
  onClearVideo,
  isUploadingVideo,
  uploadProgress,
  uploadError,
  handleVideoUpload,
  onSave,
  onCancel,
  isSaving,
  isEdit,
}: LessonFormProps) {
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
                <div className="relative rounded-2xl overflow-hidden border border-gray-100 bg-black aspect-video max-w-md mx-auto shadow-md">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <Video size={18} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">
                    {videoFileName || (draft.video_url ? 'Saved Video' : 'Selected Video')}
                  </p>
                  {draft.duration_seconds > 0 && (
                    <p className="text-[10px] text-emerald-600">{Math.round(draft.duration_seconds / 60)} min detected</p>
                  )}
                  {videoPreviewUrl && videoPreviewUrl.startsWith('blob:') && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-0.5">⚠️ Unsaved changes (Click Save to upload)</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClearVideo}
                  className="text-[10px] font-bold text-emerald-500 hover:text-red-500 transition"
                >
                  Change
                </button>
              </div>
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
