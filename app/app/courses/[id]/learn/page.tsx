'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, FileText, Layers, PlayCircle } from 'lucide-react';
import { useCourseLearning, useUpdateCourseProgress } from '@/misc/hooks/api/courses';
import type { Lesson } from '@/misc/types/course';
import VideoPlayer from '@/misc/components/VideoPlayer';

const formatDuration = (seconds?: number | null) => {
  if (!seconds) return '0m';
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes}m`;
};

export default function CourseLearnPage() {
  const { id } = useParams<{ id: string }>();
  const courseQuery = useCourseLearning(id);
  const progressMutation = useUpdateCourseProgress(id);
  const course = courseQuery.data;
  const modules = course?.modules || [];
  const lessons = useMemo(() => modules.flatMap((module) => module.lessons || []), [modules]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>();
  const lastSavedPositionRef = useRef<Record<string, number>>({});
  const completedLessonsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const resumeLessonId = course?.progress?.lastProgress?.lessonId;
    if (!selectedLessonId && (resumeLessonId || lessons[0]?.id)) {
      setSelectedLessonId(resumeLessonId || lessons[0].id);
    }
  }, [course?.progress?.lastProgress?.lessonId, lessons, selectedLessonId]);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) || lessons[0];
  const selectedLessonIndex = selectedLesson ? lessons.findIndex((lesson) => lesson.id === selectedLesson.id) : -1;
  const previousLesson = selectedLessonIndex > 0 ? lessons[selectedLessonIndex - 1] : null;
  const nextLesson = selectedLessonIndex >= 0 && selectedLessonIndex < lessons.length - 1 ? lessons[selectedLessonIndex + 1] : null;
  const completedLessonIds = useMemo(() => {
    const completed = Object.entries(course?.progress?.progressByLesson || {})
      .filter(([, row]) => row.completed)
      .map(([lessonId]) => lessonId);
    completedLessonsRef.current = new Set(completed);
    return completed;
  }, [course?.progress?.progressByLesson]);
  const completedCount = completedLessonIds.length;
  const progress = course?.progress?.progressPercent ?? (lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0);
  const progressLabel = `${completedCount}/${lessons.length} lessons completed`;
  const selectedProgress = selectedLesson?.id ? course?.progress?.progressByLesson?.[selectedLesson.id] : undefined;

  const saveProgress = (lessonId: string, completed?: boolean, lastPositionSeconds?: number) => {
    if (!lessonId) return;
    if (completed && completedLessonsRef.current.has(lessonId)) return;
    if (completed) completedLessonsRef.current.add(lessonId);

    progressMutation.mutate({ lessonId, completed, lastPositionSeconds });
  };

  const markSelectedLessonComplete = () => {
    if (!selectedLesson?.id) return;
    const lastPosition = lastSavedPositionRef.current[selectedLesson.id] || selectedProgress?.lastPositionSeconds || 0;
    saveProgress(selectedLesson.id, true, lastPosition);
  };

  const selectLesson = (lessonId?: string) => {
    if (!lessonId || lessonId === selectedLesson?.id) return;
    setSelectedLessonId(lessonId);
  };

  const goToNextLesson = () => {
    if (!nextLesson?.id) return;
    markSelectedLessonComplete();
    setSelectedLessonId(nextLesson.id);
  };

  const saveVideoPosition = (lessonId: string, position: number) => {
    const lastSaved = lastSavedPositionRef.current[lessonId] || 0;
    if (Math.abs(position - lastSaved) < 10) return;
    lastSavedPositionRef.current[lessonId] = position;
    saveProgress(lessonId, false, position);
  };

  useEffect(() => {
    if (!selectedLesson?.id || selectedLesson.type !== 'article') return;
    if (selectedProgress?.completed) return;

    const timer = window.setTimeout(() => {
      saveProgress(selectedLesson.id!, true, 0);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [selectedLesson?.id, selectedLesson?.type, selectedProgress?.completed]);

  if (courseQuery.isLoading || courseQuery.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  if (courseQuery.isError || !course) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <BookOpen size={42} className="text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-black text-[#001A72]">Course unavailable</h1>
        <p className="text-sm text-gray-500 mt-2">You may need to enroll before accessing these lessons.</p>
        <Link href={`/courses/${id}`} className="inline-flex mt-5 bg-[#001A72] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition">
          View course page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/courses" className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shrink-0">
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course Player</p>
            <h1 className="text-xl md:text-2xl font-black text-[#001A72] truncate">{course.title}</h1>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-gray-400 font-bold">Progress</p>
          <p className="text-lg font-black text-[#001A72]">{progress}%</p>
          <p className="text-[11px] text-gray-400 font-semibold">{progressLabel}</p>
        </div>
      </div>

      <div className="md:hidden bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Course Progress</p>
          <p className="text-sm font-black text-[#001A72]">{progress}%</p>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-[#FFB81C]" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[11px] text-gray-400 font-semibold mt-2">{progressLabel}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <main className="space-y-5 min-w-0">
          <div className="bg-[#050b24] rounded-3xl overflow-hidden border border-[#001A72]/10 shadow-sm min-h-[320px] flex items-center justify-center">
            {selectedLesson?.type === 'video' && selectedLesson.video_url ? (
              <VideoPlayer
                src={selectedLesson.video_url}
                title={selectedLesson.title}
                initialTime={selectedProgress?.lastPositionSeconds || 0}
                onProgress={(position: number) => selectedLesson.id && saveVideoPosition(selectedLesson.id, position)}
                onComplete={(position: number) => selectedLesson.id && saveProgress(selectedLesson.id, true, position)}
              />
            ) : selectedLesson?.type === 'video' ? (
              <div className="text-center px-6 py-16">
                <PlayCircle size={56} className="text-white/30 mx-auto mb-4" />
                <p className="text-white font-bold">Video not available yet</p>
                <p className="text-white/50 text-sm mt-1">The tutor has not uploaded a playable video for this lesson.</p>
              </div>
            ) : (
              <div className="text-center px-6 py-16">
                <FileText size={56} className="text-white/30 mx-auto mb-4" />
                <p className="text-white font-bold">Article lesson</p>
                <p className="text-white/50 text-sm mt-1">Read the content below.</p>
              </div>
            )}
          </div>

          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#FFB81C]">Current Lesson</p>
                <h2 className="text-xl font-black text-[#001A72] mt-1">{selectedLesson?.title || 'No lesson selected'}</h2>
              </div>
              {selectedLesson && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Clock size={13} /> {formatDuration(selectedLesson.duration_seconds)}
                </span>
              )}
            </div>

            {selectedLesson?.content ? (
              <div
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-[#001A72] prose-a:text-[#001A72] prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
              />
            ) : (
              <p className="text-sm text-gray-500 leading-relaxed">
                No written content has been added for this lesson yet.
              </p>
            )}

            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => selectLesson(previousLesson?.id)}
                disabled={!previousLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <p className="text-xs text-gray-400 font-bold text-center">
                Lesson {selectedLessonIndex + 1 > 0 ? selectedLessonIndex + 1 : 0} of {lessons.length}
              </p>

              <button
                type="button"
                onClick={goToNextLesson}
                disabled={!nextLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#001A72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#001A72]/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </main>

        <aside className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-black text-[#001A72] flex items-center gap-2">
                <Layers size={17} /> Curriculum
              </h3>
              <span className="text-xs font-bold text-gray-400">{lessons.length} lessons</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#FFB81C] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mt-2">{progressLabel}</p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3 space-y-3">
            {modules.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No lessons available yet.</p>
            ) : modules.map((module, moduleIndex) => (
              <div key={module.id || moduleIndex} className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Module {moduleIndex + 1}</p>
                  <p className="font-bold text-sm text-gray-800 mt-0.5">{module.title}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {(module.lessons || []).map((lesson: Lesson, lessonIndex) => {
                    const active = selectedLesson?.id === lesson.id;
                    return (
                      <button
                        key={lesson.id || lessonIndex}
                        type="button"
                        onClick={() => selectLesson(lesson.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${active ? 'bg-[#001A72]/5' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[#001A72] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {lesson.type === 'video' ? <PlayCircle size={15} /> : <FileText size={15} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-bold truncate ${active ? 'text-[#001A72]' : 'text-gray-700'}`}>{lesson.title}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDuration(lesson.duration_seconds)}</span>
                        </span>
                        {course?.progress?.progressByLesson?.[lesson.id || '']?.completed && <CheckCircle2 size={15} className="text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
