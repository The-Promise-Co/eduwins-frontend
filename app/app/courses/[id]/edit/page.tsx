'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Layout,
  FileText,
  Video,
  Save,
  CheckCircle,
  Loader2,
  Clock,
  ExternalLink,
  Upload,
  ChevronRight,
  Pencil,
  X,
  AlertCircle,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Editor from '@/components/Editor';
import { useR2 } from '@/hooks/useR2';
import { toast } from 'sonner';
import { useForm, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import {
  useCourse,
  useAddModule,
  useAddLesson,
  useUpdateCourse,
  useUpdateLesson,
  useDeleteLesson,
} from '../../misc/api';

// ── types ─────────────────────────────────────────────────────────────
type LessonDraft = {
  title: string;
  type: 'video' | 'article';
  video_url: string;
  duration_seconds: number;
  content: string;
  is_preview: boolean;
};

const EMPTY_LESSON: LessonDraft = {
  title: '',
  type: 'video',
  video_url: '',
  duration_seconds: 0,
  content: '',
  is_preview: false,
};

// ── shared styles ──────────────────────────────────────────────────────
const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none transition';
const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';

// ── page ───────────────────────────────────────────────────────────────
export default function EditCoursePage() {
  const { id } = useParams() as { id: string };

  const { data: course, isLoading, error: courseError } = useCourse(id);
  const addModuleMutation = useAddModule(id);
  const addLessonMutation = useAddLesson(id);
  const updateCourseMutation = useUpdateCourse(id);
  const updateLessonMutation = useUpdateLesson(id);
  const deleteLessonMutation = useDeleteLesson(id);
  const { uploadFile, isUploading: isUploadingVideo, progress: uploadProgress, error: uploadError, setError: setUploadError } = useR2();

  // module panel
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // lesson form — null = closed, 'new' = creating, string = lessonId being edited
  const [lessonFormMode, setLessonFormMode] = useState<null | 'new' | string>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  // Pending upload states
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  const { register, setValue, watch, reset: resetLessonForm } = useForm<LessonDraft>({
    defaultValues: EMPTY_LESSON,
  });

  const lessonDraft = watch();

  // ── helpers ────────────────────────────────────────────────────────
  const setField = (k: keyof LessonDraft, v: any) => {
    setValue(k, v);
  };

  const openNew = () => {
    resetLessonForm(EMPTY_LESSON);
    setVideoFileName(null);
    setPendingVideoFile(null);
    setVideoPreviewUrl(null);
    setLessonFormMode('new');
  };

  const openEdit = (lesson: any) => {
    resetLessonForm({
      title: lesson.title || '',
      type: lesson.type || 'video',
      video_url: lesson.video_url || '',
      duration_seconds: lesson.duration_seconds || 0,
      content: lesson.content || '',
      is_preview: lesson.is_preview ?? false,
    });
    setVideoFileName(null);
    setPendingVideoFile(null);
    setVideoPreviewUrl(lesson.video_url || null);
    setLessonFormMode(lesson.id);
  };

  const closeForm = () => {
    setLessonFormMode(null);
    resetLessonForm(EMPTY_LESSON);
    setVideoFileName(null);
    setPendingVideoFile(null);
    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
  };

  const handleClearVideo = () => {
    setValue('video_url', '');
    setValue('duration_seconds', 0);
    setVideoFileName(null);
    setPendingVideoFile(null);
    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
  };

  // ── video upload helper ────────────────────────────────────────────
  const handleVideoUpload = async (file: File) => {
    // ── Validation ──
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file.');
      return;
    }
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 500) {
      toast.error(`Video file is too large (${sizeInMB.toFixed(1)}MB). Max 500MB allowed.`);
      return;
    }

    setVideoFileName(file.name);
    setPendingVideoFile(file);

    const tempUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(tempUrl);

    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = tempUrl;
    vid.onloadedmetadata = () => {
      if (vid.duration && isFinite(vid.duration))
        setField('duration_seconds', Math.round(vid.duration));
    };
  };

  // ── mutations ──────────────────────────────────────────────────────
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const created = await addModuleMutation.mutateAsync({
        title: newModuleTitle,
        order_index: course?.modules?.length || 0,
      });
      setNewModuleTitle('');
      setAddingModule(false);
      toast.success('Module added successfully!');
      if (created?.id) setSelectedModuleId(created.id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add module');
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonDraft.title.trim() || !selectedModuleId) return;
    setIsSavingLesson(true);

    try {
      let finalVideoUrl = lessonDraft.video_url;

      // Perform R2 upload when saving
      if (lessonDraft.type === 'video' && pendingVideoFile) {
        const url = await uploadFile(pendingVideoFile, `courses/${id}`);
        console.log(url, "UPLOADED URL")
        if (!url) {
          toast.error('Failed to upload video.');
          setIsSavingLesson(false);
          return;
        }
        finalVideoUrl = url;

        // Update states immediately so we don't upload this file again
        setField('video_url', url);
        setPendingVideoFile(null);
        setVideoPreviewUrl(url);
      }

      const finalLessonDraft = {
        ...lessonDraft,
        video_url: lessonDraft.type === 'video' ? finalVideoUrl : '',
        duration_seconds: lessonDraft.type === 'video' ? lessonDraft.duration_seconds : 0,
        content: lessonDraft.type === 'article' ? lessonDraft.content : '',
      };

      if (lessonFormMode === 'new') {
        const selectedModule = course?.modules?.find((m: any) => m.id === selectedModuleId);
        await addLessonMutation.mutateAsync({
          moduleId: selectedModuleId,
          ...finalLessonDraft,
          order_index: selectedModule?.lessons?.length || 0,
        });
        toast.success('Lesson added successfully!');
      } else {
        await updateLessonMutation.mutateAsync({
          lessonId: lessonFormMode as string,
          ...finalLessonDraft,
        });
        toast.success('Lesson updated successfully!');
      }
      closeForm();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Failed to save lesson');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      await deleteLessonMutation.mutateAsync(lessonId);
      toast.success('Lesson deleted successfully.');
      if (lessonFormMode === lessonId) closeForm();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to delete lesson');
    }
  };

  const handlePublish = async () => {
    if (!course?.modules?.length) { toast.error('Add at least one module before publishing.'); return; }
    if (!course.modules.some((m: any) => m.lessons?.length > 0)) { toast.error('Add at least one lesson.'); return; }
    try {
      await updateCourseMutation.mutateAsync({ status: 'published' });
      toast.success('Course published successfully!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to publish course');
    }
  };

  // ── loading / error ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Loader2 size={40} className="text-[#001A72] animate-spin mb-3" />
        <p className="text-gray-500">Loading course…</p>
      </div>
    );
  }
  if (courseError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={40} className="text-red-500 mb-3" />
        <p className="font-bold text-gray-700">Failed to load course details.</p>
        <Link href="/app/courses" className="mt-3 text-[#001A72] text-sm font-semibold hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  const selectedModule = course?.modules?.find((m: any) => m.id === selectedModuleId) ?? null;
  const isBusy = addModuleMutation.isPending || addLessonMutation.isPending || updateLessonMutation.isPending;

  // ── render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title={`Edit: ${course.title}`}
        subtitle="Build your curriculum module by module"
        backHref="/app/courses"
        rightElement={
          <div className="flex items-center gap-3">
            {isBusy && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Saving…
              </span>
            )}
            <Link
              href={`/app/courses/${id}`}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
            >
              <ExternalLink size={16} /> Preview
            </Link>
            {course.status === 'draft' ? (
              <button
                onClick={handlePublish}
                disabled={updateCourseMutation.isPending}
                className="px-5 py-2 text-sm font-bold text-white bg-[#001A72] rounded-xl hover:bg-[#001A72]/90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {updateCourseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Publish Course
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                <CheckCircle size={16} /> Published
              </div>
            )}
          </div>
        }
      />



      {/* ── Split panel ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">

        {/* ── LEFT: Module list ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#001A72]">
              <Layout size={16} />
              <span className="text-sm font-black uppercase tracking-widest">Modules</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400">{course?.modules?.length || 0} total</span>
          </div>

          <div className="divide-y divide-gray-50">
            {(course?.modules ?? []).map((mod: any, idx: number) => {
              const isSelected = selectedModuleId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => { setSelectedModuleId(mod.id); closeForm(); }}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition group ${isSelected
                    ? 'bg-[#001A72]/5 border-l-4 border-l-[#001A72]'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${isSelected ? 'bg-[#001A72] text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#001A72]' : 'text-gray-700'}`}>
                      {mod.title}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      {mod.lessons?.length || 0} lesson{mod.lessons?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight size={14} className={`shrink-0 transition ${isSelected ? 'text-[#001A72]' : 'text-gray-300'}`} />
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-gray-100">
            {addingModule ? (
              <div className="space-y-3">
                <input
                  autoFocus
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddModule(); if (e.key === 'Escape') setAddingModule(false); }}
                  placeholder="Module title…"
                  className="w-full border border-[#001A72]/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddModule}
                    disabled={addModuleMutation.isPending || !newModuleTitle.trim()}
                    className="flex-1 py-2 bg-[#001A72] text-white text-xs font-bold rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
                  >
                    {addModuleMutation.isPending ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    onClick={() => { setAddingModule(false); setNewModuleTitle(''); }}
                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingModule(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-[#001A72] hover:text-[#001A72] hover:bg-[#001A72]/5 transition flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Module
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Lesson panel ────────────────────────────────────── */}
        {selectedModule ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Module</p>
                <h2 className="font-black text-gray-900 text-base">{selectedModule.title}</h2>
              </div>
              {lessonFormMode === null && (
                <button
                  onClick={openNew}
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
                          onClick={() => isEditing ? closeForm() : openEdit(ls)}
                          className={`p-1.5 rounded-lg transition ${isEditing ? 'text-[#001A72] bg-[#001A72]/10' : 'text-gray-400 hover:text-[#001A72] hover:bg-gray-100'}`}
                          title={isEditing ? 'Cancel edit' : 'Edit lesson'}
                        >
                          {isEditing ? <X size={14} /> : <Pencil size={14} />}
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(ls.id)}
                          disabled={deleteLessonMutation.isPending}
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
                        draft={lessonDraft}
                        setField={setField}
                        videoFileName={videoFileName}
                        videoPreviewUrl={videoPreviewUrl}
                        onClearVideo={handleClearVideo}
                        isUploadingVideo={isUploadingVideo}
                        uploadProgress={uploadProgress}
                        uploadError={uploadError}
                        handleVideoUpload={handleVideoUpload}
                        onSave={handleSaveLesson}
                        onCancel={closeForm}
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
                draft={lessonDraft}
                setField={setField}
                videoFileName={videoFileName}
                videoPreviewUrl={videoPreviewUrl}
                onClearVideo={handleClearVideo}
                isUploadingVideo={isUploadingVideo}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
                handleVideoUpload={handleVideoUpload}
                onSave={handleSaveLesson}
                onCancel={closeForm}
                isSaving={isSavingLesson}
                isEdit={false}
              />
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-[#001A72]/5 flex items-center justify-center mb-5">
              <Layout size={28} className="text-[#001A72]/40" />
            </div>
            <p className="text-sm font-bold text-gray-500">Select a module</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Choose a module from the left panel to manage its lessons, or add a new module to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LessonForm component ───────────────────────────────────────────────
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

function LessonForm({
  register, setValue, draft, setField, videoFileName, videoPreviewUrl, onClearVideo, isUploadingVideo, uploadProgress, uploadError,
  handleVideoUpload, onSave, onCancel, isSaving, isEdit,
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
