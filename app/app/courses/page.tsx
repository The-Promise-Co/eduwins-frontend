'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApi';
import { useUser } from '@/context/UserContext';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlayCircle,
  FileText,
  Layers,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import CourseCard from '@/components/CourseCard';
import { useSubjects } from './misc/api';
import { Course, LEVELS } from '@/types/course';

const MOCK_COURSES: Course[] = [];


const toSentenceCase = (s: string) => {
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

export default function CoursesPage() {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);

  const { data: subjectsData } = useSubjects();
  const ALL_SUBJECTS = [{ id: 'all', name: 'All' }, ...(subjectsData || [])];
  const filteredSubjectOptions = ALL_SUBJECTS.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const isTeacher = user?.role === 'teacher';
  const isParent = user?.role === 'parent';
  const baseUrl = isTeacher && user?.id
    ? `/courses/teacher/${user.id}`
    : isParent && user?.id
      ? `/courses/enrolled`
      : '/courses';
  const defaultMeta = { total: 0, page: 1, limit: 12, totalPages: 1 };
  const coursesQuery = useApiQuery<{ data?: Course[]; meta?: typeof defaultMeta }>(
    ['courses', isTeacher ? 'teacher' : isParent ? 'enrolled' : 'all', user?.id, page],
    `${baseUrl}?page=${page}&limit=12`,
    { enabled: isTeacher ? !!user?.id : isParent ? !!user?.id : true }
  );
  const courses = coursesQuery.data?.data || [];
  const meta = coursesQuery.data?.meta || defaultMeta;
  const loading = coursesQuery.isLoading || coursesQuery.isPending;

  const filtered = courses.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const subjectName = typeof c.subject === 'object' && c.subject ? c.subject.name : c.subject;
    const matchSubject = selectedSubject === 'All' || subjectName === selectedSubject;
    const matchLevel = selectedLevel === 'all' || c.level === selectedLevel;
    const matchStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchSearch && matchSubject && matchLevel && matchStatus;
  });

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const totalEnrolled = courses.reduce((sum, c) => sum + Number(c.enrolled_count || 0), 0);
  const avgRating = (courses.reduce((s, c) => s + Number(c.rating_avg || 0), 0) / (courses.length || 1)).toFixed(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Courses"
        subtitle={isTeacher ? 'Manage and track your created courses' : isParent ? 'Courses you have purchased' : 'Explore available courses'}
        rightElement={
          isTeacher && (
            <Link
              href="/app/courses/create"
              className="inline-flex items-center gap-2 bg-[#001A72] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition shadow-sm hover:shadow-md"
            >
              <Plus size={16} />
              Create Course
            </Link>
          )
        }
      />

      {/* Stats Banner */}
      {isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="My Courses" value={String(courses.length)} icon={BookOpen} color="text-[#001A72]" bg="bg-[#001A72]/5" />
          <StatCard label="Published" value={String(publishedCount)} icon={PlayCircle} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Total Enrolled" value={totalEnrolled.toLocaleString()} icon={Users} color="text-[#001A72]" bg="bg-[#FFB81C]/10" />
          <StatCard
            label="Avg. Rating"
            value={avgRating}
            icon={Star}
            color="text-[#FFB81C]"
            bg="bg-[#FFB81C]/10"
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${showFilters ? 'bg-[#001A72] text-white border-[#001A72]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Filter size={15} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-6">
            {/* Subject — searchable combobox */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Subject</label>
              <div className="relative" ref={subjectRef}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={subjectSearch || (selectedSubject !== 'All' ? selectedSubject : '')}
                  onChange={(e) => { setSubjectSearch(e.target.value); setSubjectOpen(true); }}
                  onFocus={() => setSubjectOpen(true)}
                  onBlur={() => setTimeout(() => setSubjectOpen(false), 150)}
                  placeholder={selectedSubject === 'All' ? 'Search subjects…' : selectedSubject}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
                />
                {subjectOpen && filteredSubjectOptions.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredSubjectOptions.map((s) => (
                      <button
                        key={s.id}
                        onMouseDown={() => {
                          setSelectedSubject(s.name);
                          setSubjectSearch('');
                          setSubjectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition hover:bg-gray-50 ${
                          selectedSubject === s.name ? 'text-[#001A72] bg-[#001A72]/5' : 'text-gray-700'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSubject !== 'All' && (
                <button
                  onClick={() => { setSelectedSubject('All'); setSubjectSearch(''); }}
                  className="mt-1.5 text-[10px] text-gray-400 hover:text-[#001A72] font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Level</label>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...LEVELS].map((l) => (
                  <button
                    key={l}
                    onClick={() => setSelectedLevel(l)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      selectedLevel === l
                        ? 'bg-[#001A72] text-white border-[#001A72]'
                        : 'border-gray-200 text-gray-600 hover:border-[#001A72] hover:text-[#001A72]'
                    }`}
                  >
                    {toSentenceCase(l)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter (Teacher Only) */}
            {isTeacher && (
              <div className="sm:col-span-2 pt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Course Status</label>
                <div className="flex gap-2">
                  {(['all', 'published', 'draft'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStatus(s)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition ${
                        selectedStatus === s
                          ? 'bg-[#001A72] text-white border-[#001A72]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {toSentenceCase(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 font-medium">
        Showing <span className="text-gray-700 font-bold">{filtered.length}</span> courses
      </p>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-gray-500 font-semibold">{courses.length === 0 && isParent ? 'No purchased courses yet' : 'No courses found'}</p>
          <p className="text-gray-400 text-sm mt-1">
            {courses.length === 0 && isParent
              ? 'Courses you purchase will appear here'
              : 'Try adjusting your search or filters'}
          </p>
          {isTeacher && (
            <Link
              href="/app/courses/create"
              className="mt-4 inline-flex items-center gap-2 bg-[#001A72] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition"
            >
              <Plus size={16} />
              Create your first course
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} isTeacher={isTeacher} />
            ))}
          </div>

          {/* Pagination Controls */}
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
    </div>
  );
}
