'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { usePublicCourses } from '@/misc/hooks/api/courses';
import { Course, LEVELS } from '@/misc/types/course';
import PublicCourseCard from '@/misc/components/PublicCourseCard';

const toSentenceCase = (s: string) => {
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

function CoursesContent() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const defaultMeta = { total: 0, page: 1, limit: 12, totalPages: 1 };
  const coursesQuery = usePublicCourses(page);
  const courses = coursesQuery.data?.data || [];
  const meta = coursesQuery.data?.meta || defaultMeta;
  const loading = coursesQuery.isLoading || coursesQuery.isPending;

  const filtered = courses.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = selectedLevel === 'all' || c.level === selectedLevel;
    return matchSearch && matchLevel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <section className="relative overflow-hidden bg-[#001A72]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            <Sparkles size={14} />
            Browse All Courses
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
            Find the Right{' '}
            <span className="text-[#FFB81C] relative">
              Course
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q100 0 200 6" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>{' '}
            for You
          </h1>
          <p className="text-white/60 text-sm mb-8 max-w-lg">
            Browse courses created by expert tutors across various subjects and levels.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg">
              <Search size={18} className="text-[#001A72] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses, teachers…"
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Level filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['all', ...LEVELS].map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${selectedLevel === l
                  ? 'bg-[#FFB81C] text-[#001A72] border-[#FFB81C]'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
              >
                {l === 'all' ? 'All Levels' : toSentenceCase(l)}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Results ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-1">Available Courses</p>
            <h2 className="text-2xl font-black text-[#001A72]">
              {filtered.length} Course{filtered.length !== 1 ? 's' : ''} Found
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-[#001A72]/5 flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-[#001A72]/40" />
            </div>
            <h3 className="text-xl font-black text-[#001A72] mb-2">No Courses Found</h3>
            <p className="text-gray-500 text-sm max-w-xs">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10 pb-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-[#001A72]">Page {page}</span>
                  <span className="text-sm text-gray-400">of {meta.totalPages}</span>
                </div>

                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Bottom CTA ── */}
      {filtered.length > 0 && (
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#001A72] via-[#0028a8] to-[#001A72] rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB81C]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-3">Are You a Tutor?</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Create Your Own Course</h2>
              <p className="text-white/60 text-sm mb-7 max-w-md mx-auto">
                Share your knowledge with students across Nigeria by creating a course on Eduwins.
              </p>
              <Link
                href="/register-teacher"
                className="inline-flex items-center gap-2 bg-[#FFB81C] text-[#001A72] font-black px-8 py-3.5 rounded-2xl hover:bg-[#ffd06f] transition shadow-lg"
              >
                Become a Tutor <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    }>
      <CoursesContent />
    </Suspense>
  );
}
