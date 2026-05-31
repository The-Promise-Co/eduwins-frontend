'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  CheckCircle,
  Loader2,
  ExternalLink,
  Pencil,
  AlertCircle,
  Layout,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useR2 } from '@/hooks/useR2';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import {
  useCourse,
  useAddModule,
  useAddLesson,
  useUpdateCourse,
  useUpdateLesson,
  useDeleteLesson,
} from '../../misc/api';

import EditCourseInfoModal from './components/EditCourseInfoModal';
import ModuleList from './components/ModuleList';
import LessonManagement from './components/LessonManagement';
import { LessonDraft } from './components/LessonForm';

const EMPTY_LESSON: LessonDraft = {
  title: '',
  type: 'video',
  video_url: '',
  duration_seconds: 0,
  content: '',
  is_preview: false,
};

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
  const { uploadFile: uploadThumbnail, isUploading: isUploadingThumbnail } = useR2();

  // Edit Course Details states
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // module panel
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

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
  const handleSaveCourseInfo = async (formData: any, newThumbnailFile: File | null) => {
    setIsSavingInfo(true);
    try {
      let finalThumbnailUrl = course.thumbnail_url;

      if (newThumbnailFile) {
        const uploaded = await uploadThumbnail(newThumbnailFile, `courses/${id}`);
        if (!uploaded) {
          toast.error('Failed to upload course thumbnail. Please try again.');
          setIsSavingInfo(false);
          return;
        }
        finalThumbnailUrl = uploaded;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        level: formData.level,
        duration_weeks: Number(formData.duration_weeks),
        price: formData.is_free ? 0 : Number(formData.price),
        is_free: formData.is_free,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : formData.tags,
        requirements: formData.requirements,
        what_you_learn: formData.what_you_learn,
        thumbnail_url: finalThumbnailUrl,
      };

      await updateCourseMutation.mutateAsync(payload);
      toast.success('Course information updated successfully!');
      setIsInfoModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update course details.');
    } finally {
      setIsSavingInfo(false);
    }
  };

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
            <button
              onClick={() => setIsInfoModalOpen(true)}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Pencil size={14} /> Edit Details
            </button>
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
        <ModuleList
          modules={course?.modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          onCloseForm={closeForm}
          onAddModule={async (title) => {
            const created = await addModuleMutation.mutateAsync({
              title,
              order_index: course?.modules?.length || 0,
            });
            if (created?.id) setSelectedModuleId(created.id);
            toast.success('Module added successfully!');
          }}
          isAddingModulePending={addModuleMutation.isPending}
        />

        {/* ── RIGHT: Lesson panel ────────────────────────────────────── */}
        {selectedModule ? (
          <LessonManagement
            selectedModule={selectedModule}
            lessonFormMode={lessonFormMode}
            onOpenNew={openNew}
            onOpenEdit={openEdit}
            onCloseForm={closeForm}
            onDeleteLesson={handleDeleteLesson}
            isDeletingLesson={deleteLessonMutation.isPending}
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
            onSaveLesson={handleSaveLesson}
            isSavingLesson={isSavingLesson}
          />
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

      <EditCourseInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        course={course}
        onSave={handleSaveCourseInfo}
        isSaving={isSavingInfo}
      />
    </div>
  );
}


