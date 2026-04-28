'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Star,
  Clock,
  Layers,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Tag,
  Globe,
  Archive,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import Section from '@/components/Section';
import { Course } from '@/types/course';

interface AnalyticSnapshot {
  week: string;
  enrollments: number;
  revenue: number;
  views: number;
}

interface StudentEnrolled {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
  progress_percent: number;
  last_active?: string;
}

const MOCK_COURSE: Course = {
  id: '1',
  title: 'Complete Mathematics for WAEC & JAMB',
  description: 'Master all Mathematics topics needed to ace your WAEC and JAMB examinations, with step-by-step video lessons, practice tests and over 500 past exam questions with worked solutions. This course covers Algebra, Sequences, Trigonometry, Calculus, Statistics and Probability.',
  subject: 'Mathematics',
  level: 'Intermediate',
  duration_weeks: 12,
  price: 15000,
  is_free: false,
  status: 'published',
  teacher_name: 'Mr. Adewale Okonkwo',
  rating_avg: 4.8,
  enrolled_count: 324,
  lesson_count: 48,
  created_at: '2025-01-15T09:00:00Z',
  tags: ['WAEC', 'JAMB', 'Algebra', 'Calculus', 'Trigonometry'],
};

const MOCK_ANALYTICS: AnalyticSnapshot[] = [
  { week: 'Week 1', enrollments: 24, revenue: 360000, views: 312 },
  { week: 'Week 2', enrollments: 38, revenue: 570000, views: 498 },
  { week: 'Week 3', enrollments: 29, revenue: 435000, views: 401 },
  { week: 'Week 4', enrollments: 56, revenue: 840000, views: 712 },
  { week: 'Week 5', enrollments: 41, revenue: 615000, views: 534 },
  { week: 'Week 6', enrollments: 67, revenue: 1005000, views: 879 },
  { week: 'Week 7', enrollments: 69, revenue: 1035000, views: 924 },
];

const MOCK_STUDENTS: StudentEnrolled[] = [
  { id: '1', name: 'Adaeze Nwosu', email: 'adaeze@mail.com', enrolled_at: '2025-01-20', progress_percent: 82, last_active: '2025-04-10' },
  { id: '2', name: 'Chidi Okafor', email: 'chidi@mail.com', enrolled_at: '2025-02-01', progress_percent: 45, last_active: '2025-04-22' },
  { id: '3', name: 'Fatima Bello', email: 'fatima@mail.com', enrolled_at: '2025-02-14', progress_percent: 100, last_active: '2025-03-30' },
  { id: '4', name: 'Emeka Eze', email: 'emeka@mail.com', enrolled_at: '2025-03-01', progress_percent: 21, last_active: '2025-04-18' },
  { id: '5', name: 'Ngozi Ibrahim', email: 'ngozi@mail.com', enrolled_at: '2025-03-15', progress_percent: 67, last_active: '2025-04-23' },
];

const MOCK_MODULES = [
  {
    id: 1, title: 'Module 1: Number & Numeration', lessons: [
      { id: 1, title: 'Integers and Number Bases', duration_seconds: 45 * 60, is_preview: true },
      { id: 2, title: 'Fractions, Decimals & Percentages', duration_seconds: 38 * 60, is_preview: false },
      { id: 3, title: 'Indices and Logarithms', duration_seconds: 52 * 60, is_preview: false },
    ]
  },
  {
    id: 2, title: 'Module 2: Algebra', lessons: [
      { id: 4, title: 'Linear Equations & Inequalities', duration_seconds: 60 * 60, is_preview: false },
      { id: 5, title: 'Quadratic Equations', duration_seconds: 55 * 60, is_preview: false },
      { id: 6, title: 'Simultaneous Equations', duration_seconds: 48 * 60, is_preview: false },
    ]
  },
  {
    id: 3, title: 'Module 3: Geometry & Trigonometry', lessons: [
      { id: 7, title: 'Angles and Polygons', duration_seconds: 42 * 60, is_preview: false },
      { id: 8, title: 'Circles and Constructions', duration_seconds: 50 * 60, is_preview: false },
      { id: 9, title: 'Trigonometric Ratios', duration_seconds: 65 * 60, is_preview: false },
    ]
  },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
};

type TabId = 'overview' | 'analytics' | 'curriculum' | 'students';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState(MOCK_MODULES);
  const [analytics, setAnalytics] = useState<AnalyticSnapshot[]>([]);
  const [students, setStudents] = useState<StudentEnrolled[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({ 0: true });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, analyticsRes, studentsRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/courses/${id}/analytics`),
          isTeacher ? api.get(`/courses/${id}/students`) : Promise.resolve({ data: [] }),
        ]);
        setCourse(courseRes.data);
        setAnalytics(analyticsRes.data);
        setStudents(studentsRes.data);
      } catch {
        setCourse(MOCK_COURSE);
        setAnalytics(MOCK_ANALYTICS);
        setStudents(isTeacher ? MOCK_STUDENTS : []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isTeacher]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setEnrollSuccess(true);
    } catch {
      setEnrollSuccess(true); // Demo mode
    } finally {
      setEnrolling(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/courses/${id}`, { status: newStatus });
      setCourse((p) => p ? { ...p, status: newStatus as any } : p);
    } catch {
      setCourse((p) => p ? { ...p, status: newStatus as any } : p);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      await api.delete(`/courses/${id}`);
    } catch { /* demo */ }
    router.push('/app/courses');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="font-bold text-gray-700">Course not found</p>
        <Link href="/app/courses" className="mt-3 text-[#001A72] text-sm font-semibold hover:underline">Back to courses</Link>
      </div>
    );
  }

  const totalRevenue = analytics.reduce((s, a) => s + a.revenue, 0);
  const totalViews = analytics.reduce((s, a) => s + a.views, 0);
  const maxEnrollments = Math.max(...analytics.map((a) => a.enrollments), 1);

  const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    ...(isTeacher ? [{ id: 'analytics' as TabId, label: 'Analytics', icon: BarChart3 }] : []),
    { id: 'curriculum', label: 'Curriculum', icon: Layers },
    ...(isTeacher ? [{ id: 'students' as TabId, label: 'Students', icon: Users }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/courses"
          className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition"
        >
          <ArrowLeft size={16} className="text-gray-600" />
        </Link>
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link href="/app/courses" className="hover:text-[#001A72]">Courses</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{course.title}</span>
        </nav>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#001A72] to-[#0040c8] rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex-1 min-w-0">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${LEVEL_COLORS[course.level]}`}>
                {course.level.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white">
                {course.subject}
              </span>
              {isTeacher && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[course.status]}`}>
                  {course.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black leading-snug mb-2">{course.title}</h1>
            <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-2xl line-clamp-3">
              {course.description}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-white/70">
                <Users size={14} /> {course.enrolled_count?.toLocaleString()} enrolled
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <Layers size={14} /> {course.lesson_count} lessons
              </span>
              <span className="flex items-center gap-1.5 text-white/70">
                <Clock size={14} /> {course.duration_weeks} weeks
              </span>
              {course.rating_avg && course.rating_avg > 0 && (
                <span className="flex items-center gap-1.5 text-[#FFB81C]">
                  <Star size={14} className="fill-[#FFB81C]" />
                  <span className="font-bold">{course.rating_avg.toFixed(1)}</span>
                </span>
              )}
            </div>

            <p className="text-white/50 text-xs mt-3">By {course.teacher_name}</p>
          </div>

          {/* Price / Actions panel */}
          <div className="md:w-56 lg:w-64 shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <p className="text-3xl font-black mb-1">
                {course.is_free ? <span className="text-emerald-300">Free</span> : `₦${course.price.toLocaleString()}`}
              </p>
              {!course.is_free && <p className="text-xs text-white/50 mb-4">One-time access</p>}

              {isTeacher ? (
                <div className="space-y-2">
                  <Link
                    href={`/app/courses/${course.id}/edit`}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] py-2.5 rounded-xl font-bold text-sm hover:bg-[#FFB81C]/90 transition"
                  >
                    <Edit size={15} /> Edit Course
                  </Link>
                  {course.status === 'draft' && (
                    <button
                      onClick={() => handleStatusChange('published')}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition"
                    >
                      <Globe size={15} /> Publish
                    </button>
                  )}
                  {course.status === 'published' && (
                    <button
                      onClick={() => handleStatusChange('archived')}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition"
                    >
                      <Archive size={15} /> Archive
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-300 py-2.5 rounded-xl font-bold text-sm hover:bg-red-500/30 transition"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              ) : enrollSuccess ? (
                <div className="text-center">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-white text-sm">You're enrolled!</p>
                  <p className="text-white/60 text-xs mt-1">Start learning below</p>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-[#FFB81C] text-[#001A72] py-3 rounded-xl font-black text-sm hover:bg-[#FFB81C]/90 transition disabled:opacity-60"
                >
                  {enrolling ? 'Processing…' : course.is_free ? 'Enroll for Free' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {course.tags && course.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs font-medium px-3 py-1 bg-[#001A72]/5 text-[#001A72] rounded-full border border-[#001A72]/10">
              <Tag size={11} /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === id
                ? 'bg-white text-[#001A72] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <Section title="About This Course" icon={BookOpen}>
              <p className="text-sm text-gray-600 leading-relaxed">{course.description}</p>
            </Section>

            {/* Quick Stats */}
            <Section title="Course Stats" icon={TrendingUp}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetaStat icon={Users} label="Students" value={course.enrolled_count?.toLocaleString() ?? '0'} color="text-blue-600" bg="bg-blue-50" />
                <MetaStat icon={Star} label="Rating" value={course.rating_avg?.toFixed(1) ?? 'N/A'} color="text-amber-600" bg="bg-amber-50" />
                <MetaStat icon={Layers} label="Lessons" value={String(course.lesson_count ?? 0)} color="text-purple-600" bg="bg-purple-50" />
                <MetaStat icon={Clock} label="Duration" value={`${course.duration_weeks}w`} color="text-green-600" bg="bg-green-50" />
              </div>
            </Section>
          </div>

          {/* Details sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-700 text-sm border-b border-gray-100 pb-3">Course Details</h3>
              <DetailRow icon={Tag} label="Subject" value={course.subject} />
              <DetailRow icon={BookOpen} label="Level" value={course.level} />
              <DetailRow icon={Clock} label="Duration" value={`${course.duration_weeks} weeks`} />
              <DetailRow icon={Layers} label="Lessons" value={`${course.lesson_count} lessons`} />
              <DetailRow icon={DollarSign} label="Price" value={course.is_free ? 'Free' : `₦${course.price.toLocaleString()}`} />
              {course.created_at && (
                <DetailRow
                  icon={Calendar}
                  label="Created"
                  value={new Date(course.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                />
              )}
              <DetailRow icon={UserCheck} label="Instructor" value={course.teacher_name ?? 'N/A'} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && isTeacher && (
        <div className="space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} sub="All time" icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard label="Total Enrolled" value={(course.enrolled_count ?? 0).toLocaleString()} sub="Students" icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <KpiCard label="Total Views" value={totalViews.toLocaleString()} sub="Course page views" icon={Eye} color="text-purple-600" bg="bg-purple-50" />
            <KpiCard label="Avg. Rating" value={(course.rating_avg ?? 0).toFixed(1)} sub="Out of 5" icon={Star} color="text-amber-600" bg="bg-amber-50" />
          </div>

          {/* Weekly Enrollments Chart */}
          <Section title="Weekly Enrollments" icon={TrendingUp}>
            <div className="space-y-2">
              {analytics.map((snapshot) => (
                <div key={snapshot.week} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 shrink-0">{snapshot.week}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#001A72] to-[#0040c8] rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${(snapshot.enrollments / maxEnrollments) * 100}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{snapshot.enrollments}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-20 text-right shrink-0">
                    ₦{snapshot.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Revenue chart */}
          <Section title="Revenue Trend (₦)" icon={DollarSign}>
            <div className="flex items-end gap-2 h-32">
              {analytics.map((snapshot, i) => {
                const maxRev = Math.max(...analytics.map((a) => a.revenue), 1);
                const pct = (snapshot.revenue / maxRev) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-400 font-medium">{(snapshot.revenue / 1000).toFixed(0)}k</span>
                    <div
                      className="w-full bg-gradient-to-t from-[#FFB81C] to-[#FFB81C]/60 rounded-t-lg"
                      style={{ height: `${pct}%`, minHeight: 4 }}
                    />
                    <span className="text-[9px] text-gray-400">{snapshot.week.replace('Week ', 'W')}</span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <Section title={`Course Curriculum — ${modules.length} Modules`} icon={Layers}>
          <div className="space-y-3">
            {modules.map((mod, i) => (
              <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedModules((p) => ({ ...p, [i]: !p[i] }))}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white bg-[#001A72] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-bold text-gray-800 text-sm">{mod.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>
                    {expandedModules[i] ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {expandedModules[i] && (
                  <div className="divide-y divide-gray-50">
                    {mod.lessons.map((lesson, j) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-gray-50/50 transition">
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
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {activeTab === 'students' && isTeacher && (
        <Section title={`Enrolled Students — ${students.length}`} icon={Users}>
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No students enrolled yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {students.map((student) => (
                <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
                  <div className="w-9 h-9 rounded-full bg-[#001A72] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-400">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">{student.progress_percent}% complete</span>
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${student.progress_percent === 100 ? 'bg-emerald-500' : 'bg-[#001A72]'}`}
                          style={{ width: `${student.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-gray-400">Enrolled</p>
                      <p className="text-xs font-medium text-gray-600">
                        {new Date(student.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {student.progress_percent === 100 && (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
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

function KpiCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub: string; icon: any; color: string; bg: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-2xl font-black ${color} leading-tight`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
