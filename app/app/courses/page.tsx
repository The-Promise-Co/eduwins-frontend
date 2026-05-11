'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Star,
  ChevronRight,
  Filter,
  PlayCircle,
  FileText,
  Layers,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useSubjects } from './misc/api';
import { Course, LEVELS } from '@/types/course';

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Complete Mathematics for WAEC & JAMB',
    description: 'Master all Mathematics topics needed to ace your WAEC and JAMB examinations, with step-by-step video lessons and practice tests.',
    subject: 'Mathematics',
    level: 'intermediate',
    duration_weeks: 12,
    price: 15000,
    is_free: false,
    status: 'published',
    teacher_name: 'Mr. Adewale Okonkwo',
    rating_avg: 4.8,
    enrolled_count: 324,
    lesson_count: 48,
    tags: ['WAEC', 'JAMB', 'Algebra', 'Calculus'],
  },
  {
    id: '2',
    title: 'English Language & Literature Mastery',
    description: 'Comprehensive English course covering grammar, comprehension, essay writing, and literary analysis for secondary school students.',
    subject: 'English',
    level: 'beginner',
    duration_weeks: 8,
    price: 0,
    is_free: true,
    status: 'published',
    teacher_name: 'Mrs. Chioma Eze',
    rating_avg: 4.6,
    enrolled_count: 512,
    lesson_count: 32,
    tags: ['Grammar', 'Essay', 'Literature'],
  },
  {
    id: '3',
    title: 'Physics Fundamentals — Mechanics & Waves',
    description: 'Deep dive into mechanics, waves, optics and modern physics. Includes practicals and exam-focused revision materials.',
    subject: 'Physics',
    level: 'advanced',
    duration_weeks: 10,
    price: 12000,
    is_free: false,
    status: 'published',
    teacher_name: 'Dr. Emeka Chukwu',
    rating_avg: 4.9,
    enrolled_count: 189,
    lesson_count: 40,
    tags: ['Mechanics', 'Waves', 'Optics', 'WAEC'],
  },
  {
    id: '4',
    title: 'Introduction to Computer Science & Coding',
    description: 'Learn the foundations of programming, algorithms, and data structures using Python. Perfect for beginners with no prior experience.',
    subject: 'Computer Science',
    level: 'beginner',
    duration_weeks: 6,
    price: 8000,
    is_free: false,
    status: 'published',
    teacher_name: 'Mr. Bello Suleiman',
    rating_avg: 4.7,
    enrolled_count: 276,
    lesson_count: 24,
    tags: ['Python', 'Algorithms', 'Coding'],
  },
  {
    id: '5',
    title: 'Chemistry — Organic & Inorganic Reactions',
    description: 'Structured course covering bonding, reactions, stoichiometry, and organic chemistry with exam past questions.',
    subject: 'Chemistry',
    level: 'intermediate',
    duration_weeks: 9,
    price: 10000,
    is_free: false,
    status: 'draft',
    teacher_name: 'Dr. Ngozi Okafor',
    rating_avg: 4.5,
    enrolled_count: 0,
    lesson_count: 36,
    tags: ['Organic', 'Inorganic', 'NECO'],
  },
  {
    id: '6',
    title: 'Economics for Beginners',
    description: 'Understand micro and macroeconomics, supply & demand, market structures, and national income accounting.',
    subject: 'Economics',
    level: 'beginner',
    duration_weeks: 7,
    price: 0,
    is_free: true,
    status: 'published',
    teacher_name: 'Mrs. Fatima Aliyu',
    rating_avg: 4.4,
    enrolled_count: 398,
    lesson_count: 28,
    tags: ['Micro', 'Macro', 'Markets'],
  },
];

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

/** "all_levels" → "All levels" */
const toSentenceCase = (s: string) => {
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

export default function CoursesPage() {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('all');
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

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
      } catch {
        setCourses(MOCK_COURSES);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => {
    const matchSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'All' || c.subject === selectedSubject;
    const matchLevel = selectedLevel === 'all' || c.level === selectedLevel;
    return matchSearch && matchSubject && matchLevel;
  });

  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);

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
        subtitle={isTeacher ? 'Manage and track your created courses' : 'Explore available courses'}
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
            value={(courses.reduce((s, c) => s + (c.rating_avg || 0), 0) / (courses.length || 1)).toFixed(1)}
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
          <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
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
          <p className="text-gray-500 font-semibold">No courses found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} isTeacher={isTeacher} />
          ))}
        </div>
      )}
    </div>
  );
}


function CourseCard({ course, isTeacher }: { course: Course; isTeacher: boolean }) {
  return (
    <Link href={`/app/courses/${course.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col h-full">
        {/* Thumbnail / Color band */}
        <div className="h-3 w-full bg-gradient-to-r from-[#001A72] to-[#0040c8]" />

        <div className="p-5 flex-1 flex flex-col">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[course.level as string] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {toSentenceCase(course.level as string)}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#001A72]/5 text-[#001A72] border-[#001A72]/20">
              {course.subject}
            </span>
            {isTeacher && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-auto capitalize ${STATUS_COLORS[course.status]}`}>
                {course.status}
              </span>
            )}
          </div>

          {/* Title & description */}
          <h3 className="font-bold text-[#001A72] text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[#0028a5] transition">
            {course.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {course.description}
          </p>

          {/* Meta info */}
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Layers size={12} />
                {course.lesson_count} lessons
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {course.duration_weeks}w
              </span>
            </div>
            {course.enrolled_count !== undefined && (
              <span className="flex items-center gap-1">
                <Users size={12} />
                {course.enrolled_count.toLocaleString()}
              </span>
            )}
          </div>

          {/* Teacher & Price row */}
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">{course.teacher_name}</p>
              {course.rating_avg && course.rating_avg > 0 ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-gray-700">{course.rating_avg.toFixed(1)}</span>
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

        {/* CTA Row */}
        <div className="px-5 pb-4">
          <div className="flex items-center justify-between text-[#001A72]">
            <span className="text-xs font-bold group-hover:underline">
              {isTeacher ? 'View details' : 'Enroll now'}
            </span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}
