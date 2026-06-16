import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Clock,
  Users,
  Star,
  ChevronRight,
  Pencil,
  Eye,
  MoreVertical
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

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col h-full relative">
      {/* Thumbnail / Color band */}
      <Link href={`/app/courses/${course.id}`} className="block">
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
        <Link href={`/app/courses/${course.id}`} className="block">
          <h3 className="font-bold text-[#001A72] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[#0028a5] transition">
            {course.title}
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mb-2">
            By {tutorName}
          </p>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>
        </Link>

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

        {/* Teacher & Price row */}
        <div className="mt-3 flex items-center justify-between">
          {!isTeacher && (
            <div>
              <p className="text-[10px] text-gray-400 font-medium">{tutorName}</p>
              {course.rating_avg && Number(course.rating_avg) > 0 ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-700">{Number(course.rating_avg).toFixed(1)}</span>
                </div>
              ) : null}
            </div>
          )}
          <div className={`${isTeacher ? 'w-full' : ''} text-right`}>
            {course.is_free ? (
              <span className="text-sm font-black text-emerald-600">Free</span>
            ) : (
              <span className="text-sm font-black text-[#001A72]">₦{Number(course.price || 0).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* CTA Row (Non-Teacher) */}
      {!isTeacher && (
        <div className="px-5 pb-4">
          <Link href={`/app/courses/${course.id}`} className="flex items-center justify-between text-[#001A72]">
            <span className="text-xs font-bold group-hover:underline">
              View course
            </span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
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
