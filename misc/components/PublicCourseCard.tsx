'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Layers, Star, Users } from 'lucide-react';
import { Course } from '@/misc/types/course';

const COURSE_AVATAR_GRADIENTS = [
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

const getCourseAvatarGradient = (id: string | number | undefined) => {
  const seed = String(id || 'course')
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COURSE_AVATAR_GRADIENTS[seed % COURSE_AVATAR_GRADIENTS.length];
};

export default function PublicCourseCard({ course }: { course: Course }) {
  const [imageFailed, setImageFailed] = useState(false);
  const lessonCount = course.lesson_count || 0;
  const subjectName = typeof course.subject === 'object' && course.subject ? course.subject.name : course.subject || '';
  const hasThumbnail = !!course.thumbnail_url && !imageFailed;
  const tutorHref = course.teacher_id ? `/tutors/${course.teacher_id}` : null;

  return (
    <article
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col h-full cursor-pointer"
    >
      <Link href={`/courses/${course.id}`} className="block">
        {hasThumbnail ? (
          <div className="relative h-40 overflow-hidden">
            <img
              src={course.thumbnail_url || undefined}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <CourseBadges course={course} subjectName={subjectName} />
          </div>
        ) : (
          <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${getCourseAvatarGradient(course.id)} flex items-center justify-center`}>
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black text-white shadow-xl backdrop-blur-sm border border-white/20">
              {getCourseInitials(course.title)}
            </div>
            <CourseBadges course={course} subjectName={subjectName} />
          </div>
        )}
      </Link>

      <div className="flex-1 flex flex-col p-4">
        <Link href={`/courses/${course.id}`}>
          <h3 className="font-bold text-[#001A72] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[#0028a5] transition">
            {course.title}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
          {course.description}
        </p>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Layers size={12} />
              {lessonCount} lessons
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

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">
              By{' '}
              {tutorHref ? (
                <Link href={tutorHref} className="hover:text-[#001A72] hover:underline">
                  {course.teacher_name || 'Unknown'}
                </Link>
              ) : (
                course.teacher_name || 'Unknown'
              )}
            </p>
            {course.rating_avg && Number(course.rating_avg) > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-gray-700">{Number(course.rating_avg).toFixed(1)}</span>
              </div>
            ) : null}
          </div>
          <div className="text-right">
            {course.is_free ? (
              <span className="text-sm font-black text-emerald-600">Free</span>
            ) : (
              <span className="text-sm font-black text-[#001A72]">₦{Number(course.price || 0).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex justify-end">
        <Link href={`/courses/${course.id}`} aria-label={`View ${course.title}`}>
          <ChevronRight size={14} className="text-[#001A72]/30 group-hover:text-[#001A72] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </article>
  );
}

function CourseBadges({ course, subjectName }: { course: Course; subjectName: string }) {
  return (
    <div className="absolute bottom-2 left-3 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/20 backdrop-blur-sm text-white border-white/30 capitalize">
        {(course.level || '').replace('_', ' ')}
      </span>
      {subjectName && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/20 backdrop-blur-sm text-white border-white/30">
          {subjectName}
        </span>
      )}
    </div>
  );
}
