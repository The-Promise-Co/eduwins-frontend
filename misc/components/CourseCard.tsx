import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Clock,
  Users,
  Pencil,
  Eye,
  MoreVertical,
  BookOpen
} from 'lucide-react';
import { Course } from '@/misc/types/course';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-50 text-green-700 border-green-200',
  intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  advanced: 'bg-purple-50 text-purple-700 border-purple-200',
  all_levels: 'bg-teal-50 text-teal-700 border-teal-200',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
};

const toSentenceCase = (s: string) => {
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

const AVATAR_GRADIENTS = [
  'from-[#001A72] via-[#0033a0] to-[#FFB81C]',
  'from-indigo-700 via-blue-600 to-cyan-400',
  'from-emerald-700 via-teal-600 to-lime-300',
  'from-purple-700 via-fuchsia-600 to-amber-300',
  'from-slate-800 via-[#001A72] to-sky-400',
];

const getCourseInitials = (title: string) => {
  const words = title.split(' ').filter(Boolean);
  if (words.length === 0) return 'C';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getAvatarGradient = (id: string | number | undefined) => {
  const seed = String(id || 'course')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[seed % AVATAR_GRADIENTS.length];
};

const clampProgress = (value: number) => Math.min(100, Math.max(0, Math.round(value || 0)));

interface CourseCardProps {
  course: Course;
  isTeacher: boolean;
}

export default function CourseCard({ course, isTeacher }: CourseCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tutorName = course.teacher_name || 'Tutor';
  const showThumbnail = !!course.thumbnail_url && !imageFailed;
  const courseHref = isTeacher ? `/app/courses/${course.id}` : `/app/courses/${course.id}/learn`;
  const tutorHref = course.teacher_id ? `/tutors/${course.teacher_id}` : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setImageFailed(false);
  }, [course.thumbnail_url]);

  if (!isTeacher) {
    const lessonCount = course.lesson_count || 0;
    const courseProgress = typeof (course as any).progress === 'number' ? (course as any).progress : course.progress?.progressPercent;
    const progress = clampProgress(Number(course.progress_percent ?? courseProgress ?? 0));
    const completedLessons = course.progress?.completedLessons || Math.round((progress / 100) * lessonCount);
    const subjectName = typeof course.subject === 'object' && course.subject ? course.subject.name : course.subject;
    const chips = [subjectName, course.level ? toSentenceCase(course.level) : null].filter(Boolean).slice(0, 2);

    return (
      <Link
        href={courseHref}
        className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden p-3"
      >
        <div className="relative h-40 rounded-xl overflow-hidden bg-[#001A72]/5 flex items-center justify-center">
          <span className="absolute left-2 top-2 z-10 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black text-[#001A72] shadow-sm uppercase tracking-wide">
            {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
          </span>

          {showThumbnail ? (
            <img
              src={course.thumbnail_url || undefined}
              alt={course.title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <LearningCourseIllustration />
          )}
        </div>

        <div className="pt-3">
          <div className="flex flex-wrap gap-2 mb-3 min-h-6">
            {chips.map((chip) => (
              <span key={String(chip)} className="rounded-lg bg-[#001A72]/5 border border-[#001A72]/10 px-2.5 py-1 text-[10px] font-bold text-[#001A72]">
                {chip}
              </span>
            ))}
          </div>

          <h3 className="text-base leading-snug font-black text-[#001A72] line-clamp-2 group-hover:text-[#0028a5] transition">
            {course.title}
          </h3>

          <div className="mt-5 pt-3 border-t border-gray-50 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <p className="text-gray-400 font-medium">
                Level: <span className="font-black text-[#001A72]">{toSentenceCase(course.level || 'all_levels')}</span>
              </p>
              <span className="font-black text-[#001A72]">{progress}% complete</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-[#FFB81C]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] font-semibold text-gray-400">
              {completedLessons}/{lessonCount} lessons completed
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col h-full relative">
      {/* Thumbnail / Color band */}
      <Link href={courseHref} className="block">
        {showThumbnail ? (
          <div className="h-32 w-full relative">
            <img
              src={course.thumbnail_url || undefined}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
            <div className="absolute inset-0 bg-black/5" />
          </div>
        ) : (
          <CourseAvatar course={course} />
        )}
      </Link>

      {/* Ellipsis Menu (Teacher Only) */}
      {isTeacher && (
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-600 hover:text-[#001A72] transition"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 z-20">
              <Link
                href={`/app/courses/${course.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowMenu(false)}
              >
                <Pencil size={12} /> Edit Course
              </Link>
              <Link
                href={`/app/courses/${course.id}`}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setShowMenu(false)}
              >
                <Eye size={12} /> View Page
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[course.level as string] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {toSentenceCase(course.level as string)}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#001A72]/5 text-[#001A72] border-[#001A72]/20">
            {typeof course.subject === 'object' && course.subject ? course.subject.name : course.subject}
          </span>
          {isTeacher && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto capitalize ${STATUS_COLORS[course.status]}`}>
              {course.status}
            </span>
          )}
        </div>

        {/* Title & description */}
        <Link href={courseHref} className="block">
          <h3 className="font-bold text-[#001A72] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[#0028a5] transition">
            {course.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        </Link>
        <p className="text-[10px] text-gray-400 font-semibold mt-2 mb-2">
          By{' '}
          {tutorHref ? (
            <Link href={tutorHref} className="hover:text-[#001A72] hover:underline">
              {tutorName}
            </Link>
          ) : (
            tutorName
          )}
        </p>

        {/* Meta info */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Layers size={12} />
              {course.lesson_count || 0} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {course.duration_weeks}w
            </span>
          </div>
          {course.enrolled_count !== undefined && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {Number(course.enrolled_count).toLocaleString()}
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="mt-3 flex items-center justify-between">
          <div className={`${isTeacher ? 'w-full' : ''} text-right`}>
            {course.is_free ? (
              <span className="text-sm font-black text-emerald-600">Free</span>
            ) : (
              <span className="text-sm font-black text-[#001A72]">₦{Number(course.price || 0).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function LearningCourseIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#001A72] via-[#0033a0] to-[#FFB81C]">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30" />
      <div className="absolute -left-14 bottom-4 h-28 w-28 rounded-full bg-white/20" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white shadow-xl backdrop-blur-sm border border-white/20">
        <BookOpen size={34} className="text-white" />
      </div>
    </div>
  );
}

function CourseAvatar({ course }: { course: Course }) {
  return (
    <div className={`h-32 w-full bg-gradient-to-br ${getAvatarGradient(course.id)} relative overflow-hidden flex items-center justify-center`}>
      <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white shadow-xl backdrop-blur-sm border border-white/20">
        {getCourseInitials(course.title)}
      </div>
    </div>
  );
}
