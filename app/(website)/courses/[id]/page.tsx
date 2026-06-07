'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  Clock,
  Layers,
  DollarSign,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Loader2,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import Section from '@/misc/components/Section';
import { usePublicCourse, useEnrollCourse } from '@/misc/hooks/api/courses';
import { useInitializePaystack } from '@/misc/hooks/api/paystack';
import { useUser } from '@/misc/context/UserContext';
import { Course } from '@/misc/types/course';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  all_levels: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function PublicCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const courseQuery = usePublicCourse(id);
  const course = courseQuery.data || null;
  const modules = course?.modules || [];
  const loading = courseQuery.isLoading || courseQuery.isPending;

  const enrollMutation = useEnrollCourse(id);

  const initializePaymentMutation = useInitializePaystack();

  const handleEnroll = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${id}`);
      return;
    }
    if (!course) return;

    if (course.is_free) {
      try {
        await enrollMutation.mutateAsync();
        setEnrollSuccess(true);
      } catch {
        router.push(`/login?redirect=/courses/${id}`);
      }
    } else {
      const email = user?.email || '';
      const amount = Number(course.price || 0);
      if (!email) {
        router.push(`/login?redirect=/courses/${id}`);
        return;
      }
      try {
        setPayError(null);
        const { authorizationUrl } = await initializePaymentMutation.mutateAsync({
          email,
          amount,
          course_id: id,
        });
        window.location.href = authorizationUrl;
      } catch (err: any) {
        console.error('Course payment error:', err.response?.data || err);
        setPayError('Payment failed. Please try again.');
      }
    }
  }, [course, id, isAuthenticated, user, enrollMutation, initializePaymentMutation, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">Course not found</p>
          <Link href="/courses" className="mt-3 text-[#001A72] text-sm font-semibold hover:underline inline-block">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const lessonCount = modules.reduce((sum: any, mod: { lessons: string | any[]; }) => sum + (mod.lessons?.length || 0), 0);
  const formattedPrice = course.price ? Number(course.price).toLocaleString() : '0';
  const tagsArray: string[] = typeof course.tags === 'string'
    ? (course.tags as string).split(',').map(t => t.trim()).filter(Boolean)
    : Array.isArray(course.tags)
      ? course.tags
      : [];
  const TAG_COLORS = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-teal-100 text-teal-700 border-teal-200',
  ];
  function tagColor(i: number) { return TAG_COLORS[i % TAG_COLORS.length]; }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F8FAFC] to-white relative">
      {/* subtle background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#001A72]/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-[#FFB81C]/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* ── Back nav ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-center gap-4">
            <Link
              href="/courses"
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shadow-sm"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5">
              <Link href="/courses" className="hover:text-[#001A72]">Courses</Link>
              <span>/</span>
              <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{course.title}</span>
            </nav>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="bg-gradient-to-r from-[#001A72] via-[#0028a8] to-[#001A72] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#FFB81C]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            </div>
            <div className="relative flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner}`}>
                    {(course.level || '').replace('_', ' ')}
                  </span>
                  {course.subject && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white">
                      {typeof course.subject === 'object' && course.subject ? course.subject.name : course.subject}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-black leading-snug mb-2">{course.title}</h1>
                <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-2xl line-clamp-3">
                  {course.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Users size={14} /> {course.enrolled_count?.toLocaleString() || '0'} enrolled
                  </span>
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Layers size={14} /> {lessonCount} lessons
                  </span>
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Clock size={14} /> {course.duration_weeks} weeks
                  </span>
                  {course.rating_avg && Number(course.rating_avg) > 0 && (
                    <span className="flex items-center gap-1.5 text-[#FFB81C]">
                      <Star size={14} className="fill-[#FFB81C]" />
                      <span className="font-bold">{Number(course.rating_avg).toFixed(1)}</span>
                    </span>
                  )}
                </div>

                {course.teacher_name && <p className="text-white/50 text-xs mt-3">By {course.teacher_name}</p>}
              </div>

              <div className="md:w-56 lg:w-64 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                  <p className="text-3xl font-black mb-1">
                    {course.is_free ? <span className="text-emerald-300">Free</span> : `₦${formattedPrice}`}
                  </p>
                  {!course.is_free && <p className="text-xs text-white/50 mb-4">One-time access</p>}

                  {enrollSuccess ? (
                    <div className="text-center py-2">
                      <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-1" />
                      <p className="font-bold text-white text-sm">Enrolled!</p>
                      <p className="text-white/50 text-[10px] mt-1">Start learning in your dashboard</p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleEnroll}
                        disabled={enrollMutation.isPending || initializePaymentMutation.isPending}
                        className="w-full bg-[#FFB81C] text-[#001A72] py-3 rounded-xl font-black text-sm hover:bg-[#FFB81C]/90 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {enrollMutation.isPending
                          ? 'Enrolling…'
                          : initializePaymentMutation.isPending
                            ? 'Redirecting…'
                            : course.is_free
                              ? 'Enroll for Free'
                              : 'Enroll Now'}
                      </button>
                      {payError && (
                        <p className="text-[10px] text-red-300 text-center mt-2">{payError}</p>
                      )}
                      {!isAuthenticated && (
                        <p className="text-[10px] text-white/40 text-center mt-2">Sign in to {course.is_free ? 'enroll' : 'purchase'}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* wave divider */}
        <div className="w-full">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
          </svg>
        </div>

        {/* ── Tags ── */}
        {tagsArray.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Tag size={13} className="text-gray-400 shrink-0" />
              {tagsArray.map((tag, i) => (
                <span
                  key={tag}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${tagColor(i)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Content ── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Section title="About This Course" icon={BookOpen}>
                <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
              </Section>

              <Section title="Course Stats" icon={BookOpen}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetaStat icon={Users} label="Students" value={course.enrolled_count?.toLocaleString() ?? '0'} color="text-blue-600" bg="bg-blue-50" />
                  <MetaStat icon={Star} label="Rating" value={course.rating_avg && Number(course.rating_avg) > 0 ? Number(course.rating_avg).toFixed(1) : 'N/A'} color="text-amber-600" bg="bg-amber-50" />
                  <MetaStat icon={Layers} label="Lessons" value={String(lessonCount)} color="text-purple-600" bg="bg-purple-50" />
                  <MetaStat icon={Clock} label="Duration" value={`${course.duration_weeks}w`} color="text-green-600" bg="bg-green-50" />
                </div>
              </Section>

              {/* Curriculum */}
              <Section title={`Course Curriculum — ${modules.length} Modules`} icon={Layers}>
                {modules.length === 0 ? (
                  <div className="text-center py-12">
                    <Layers size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">No curriculum modules added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modules.map((mod, i) => (
                      <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedModules((p) => ({ ...p, [i]: !p[i] }))}
                          className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-[#001A72]/5 transition text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-white bg-[#001A72] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-bold text-gray-800 text-sm">{mod.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-gray-400">{(mod.lessons || []).length} lesson{(mod.lessons || []).length !== 1 ? 's' : ''}</span>
                            {expandedModules[i] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </div>
                        </button>

                        {expandedModules[i] && (
                          <div className="divide-y divide-gray-50">
                            {(mod.lessons || []).length === 0 ? (
                              <div className="px-5 py-3 text-xs text-gray-400 bg-white italic">
                                No lessons in this module.
                              </div>
                            ) : (
                              (mod.lessons || []).map((lesson: any, j: number) => (
                                <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-[#001A72]/[0.02] transition">
                                  <PlayCircle size={15} className="text-gray-300 shrink-0" />
                                  <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                                  <div className="flex items-center gap-3">
                                    {lesson.is_preview && (
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Preview
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400">{lesson.duration_seconds ? Math.round(lesson.duration_seconds / 60) : 0}m</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3 sticky top-24">
                <h3 className="font-bold text-gray-700 text-sm border-b border-gray-100 pb-3">Course Details</h3>
                <DetailRow icon={Tag} label="Subject" value={(typeof course.subject === 'object' && course.subject ? course.subject.name : course.subject) || 'N/A'} />
                <DetailRow icon={BookOpen} label="Level" value={(course.level || '').replace('_', ' ')} />
                <DetailRow icon={Clock} label="Duration" value={`${course.duration_weeks} weeks`} />
                <DetailRow icon={Layers} label="Lessons" value={`${lessonCount} lessons`} />
                <DetailRow icon={DollarSign} label="Price" value={course.is_free ? 'Free' : `₦${formattedPrice}`} />
                {course.teacher_name && <DetailRow icon={UserCheck} label="Instructor" value={course.teacher_name} />}
              </div>

              {/* Instructor mini card */}
              {course.teacher_name && (
                <div className="bg-gradient-to-br from-[#001A72] to-[#0028a8] rounded-2xl p-5 text-white text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#FFB81C]/20 flex items-center justify-center mx-auto mb-3">
                    <UserCheck size={22} className="text-[#FFB81C]" />
                  </div>
                  <p className="font-bold text-sm">{course.teacher_name}</p>
                  <p className="text-white/50 text-[10px] mt-0.5">Course Instructor</p>
                  <Link
                    href="/search"
                    className="mt-3 inline-block text-xs font-semibold text-[#FFB81C] hover:underline"
                  >
                    View Profile &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Shared Components ── */

function MetaStat({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="text-center">
      <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2`}>
        <Icon size={18} />
      </div>
      <p className="text-lg font-black text-gray-800">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={13} className="text-gray-400" />
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-bold text-gray-700 text-right max-w-[55%] truncate">{value}</span>
      </div>
    </div>
  );
}
