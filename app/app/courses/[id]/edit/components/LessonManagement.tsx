'use client';

import { Plus, Video, FileText, Clock, X, Pencil, Trash2 } from 'lucide-react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import LessonForm, { LessonDraft } from './LessonForm';

interface LessonManagementProps {
  selectedModule: any;
  lessonFormMode: null | 'new' | string;
  onOpenNew: () => void;
  onOpenEdit: (lesson: any) => void;
  onCloseForm: () => void;
  onDeleteLesson: (lessonId: string) => Promise<void>;
  isDeletingLesson: boolean;

  // LessonForm props forwarded
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
  onSaveLesson: () => void;
  isSavingLesson: boolean;
}

export default function LessonManagement({
  selectedModule,
  lessonFormMode,
  onOpenNew,
  onOpenEdit,
  onCloseForm,
  onDeleteLesson,
  isDeletingLesson,

  register,
  setValue,
  draft,
  setField,
  videoFileName,
  videoPreviewUrl,
  onClearVideo,
  isUploadingVideo,
  uploadProgress,
  uploadError,
  handleVideoUpload,
  onSaveLesson,
  isSavingLesson,
}: LessonManagementProps) {
  if (!selectedModule) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Module</p>
          <h2 className="font-black text-gray-900 text-base">{selectedModule.title}</h2>
        </div>
        {lessonFormMode === null && (
          <button
            onClick={onOpenNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#001A72] text-white text-xs font-bold rounded-xl hover:bg-[#001A72]/90 transition"
          >
            <Plus size={14} /> Add Lesson
          </button>
        )}
      </div>

      {/* Lesson list */}
      <div className="divide-y divide-gray-50">
        {(selectedModule.lessons ?? []).length === 0 && lessonFormMode === null && (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Video size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-500">No lessons yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Lesson" to get started</p>
          </div>
        )}

        {(selectedModule.lessons ?? []).map((ls: any, lIdx: number) => {
          const isEditing = lessonFormMode === ls.id;
          return (
            <div key={ls.id}>
              {/* Row */}
              <div className={`flex items-center gap-4 px-6 py-4 group transition ${isEditing ? 'bg-[#001A72]/5' : 'hover:bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${ls.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                  {ls.type === 'video' ? <Video size={16} /> : <FileText size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{ls.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {ls.duration_seconds > 0 && (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={9} /> {Math.round(ls.duration_seconds / 60)} min
                      </span>
                    )}
                    {ls.is_preview && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">#{lIdx + 1}</span>
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => isEditing ? onCloseForm() : onOpenEdit(ls)}
                    className={`p-1.5 rounded-lg transition ${isEditing ? 'text-[#001A72] bg-[#001A72]/10' : 'text-gray-400 hover:text-[#001A72] hover:bg-gray-100'}`}
                    title={isEditing ? 'Cancel edit' : 'Edit lesson'}
                  >
                    {isEditing ? <X size={14} /> : <Pencil size={14} />}
                  </button>
                  <button
                    onClick={() => onDeleteLesson(ls.id)}
                    disabled={isDeletingLesson}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    title="Delete lesson"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <LessonForm
                  register={register}
                  setValue={setValue}
                  draft={draft}
                  setField={setField}
                  videoFileName={videoFileName}
                  videoPreviewUrl={videoPreviewUrl}
                  onClearVideo={onClearVideo}
                  isUploadingVideo={isUploadingVideo}
                  uploadProgress={uploadProgress}
                  uploadError={uploadError}
                  handleVideoUpload={handleVideoUpload}
                  onSave={onSaveLesson}
                  onCancel={onCloseForm}
                  isSaving={isSavingLesson}
                  isEdit
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Add Lesson form */}
      {lessonFormMode === 'new' && (
        <LessonForm
          register={register}
          setValue={setValue}
          draft={draft}
          setField={setField}
          videoFileName={videoFileName}
          videoPreviewUrl={videoPreviewUrl}
          onClearVideo={onClearVideo}
          isUploadingVideo={isUploadingVideo}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          handleVideoUpload={handleVideoUpload}
          onSave={onSaveLesson}
          onCancel={onCloseForm}
          isSaving={isSavingLesson}
          isEdit={false}
        />
      )}
    </div>
  );
}
