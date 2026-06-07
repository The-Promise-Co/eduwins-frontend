'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  BarChart3,
  ClipboardList,
  GraduationCap,
  School,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookMarked,
} from 'lucide-react';
import { toast } from 'sonner';
import { useChild, Child } from '@/misc/hooks/useChildren';

type Tab = 'courses' | 'schedule' | 'analytics' | 'assessments';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'schedule', label: 'Schedule', icon: Calendar },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'assessments', label: 'Assessments', icon: ClipboardList },
];

/* ─── Mock data — replace with API calls in future ─────────────────────────── */

const MOCK_COURSES = [
  {
    id: '1',
    title: 'Primary Mathematics',
    teacher: 'Mr. Adeyemi Tunde',
    progress: 72,
    totalLessons: 24,
    completedLessons: 17,
    status: 'active',
    subject: 'Mathematics',
    thumbnail: null,
  },
  {
    id: '2',
    title: 'Basic English Language',
    teacher: 'Mrs. Funke Okafor',
    progress: 45,
    totalLessons: 20,
    completedLessons: 9,
    status: 'active',
    subject: 'English',
    thumbnail: null,
  },
  {
    id: '3',
    title: 'Introductory Science',
    teacher: 'Mr. Chukwu Emeka',
    progress: 100,
    totalLessons: 16,
    completedLessons: 16,
    status: 'completed',
    subject: 'Science',
    thumbnail: null,
  },
];

const MOCK_SCHEDULE = [
  {
    id: '1',
    subject: 'Mathematics',
    teacher: 'Mr. Adeyemi Tunde',
    date: '2026-06-03',
    time: '09:00 AM',
    duration: '1 hour',
    status: 'upcoming',
    type: 'online',
  },
  {
    id: '2',
    subject: 'English Language',
    teacher: 'Mrs. Funke Okafor',
    date: '2026-06-05',
    time: '02:00 PM',
    duration: '1 hour',
    status: 'upcoming',
    type: 'in-person',
  },
  {
    id: '3',
    subject: 'Mathematics',
    teacher: 'Mr. Adeyemi Tunde',
    date: '2026-05-27',
    time: '09:00 AM',
    duration: '1 hour',
    status: 'completed',
    type: 'online',
  },
  {
    id: '4',
    subject: 'English Language',
    teacher: 'Mrs. Funke Okafor',
    date: '2026-05-29',
    time: '02:00 PM',
    duration: '1 hour',
    status: 'completed',
    type: 'in-person',
  },
];

const MOCK_ANALYTICS = {
  overallGrade: 'B+',
  attendanceRate: 91,
  avgScore: 78,
  coursesActive: 2,
  coursesCompleted: 1,
  hoursLearned: 34,
  subjects: [
    { name: 'Mathematics', score: 82, trend: 'up', change: '+5' },
    { name: 'English', score: 74, trend: 'up', change: '+2' },
    { name: 'Science', score: 88, trend: 'down', change: '-3' },
  ],
  weeklyActivity: [4, 6, 3, 7, 5, 0, 0], // hours per day (Mon–Sun)
};

const MOCK_ASSESSMENTS = [
  {
    id: '1',
    title: 'Mathematics Mid-Term Test',
    subject: 'Mathematics',
    teacher: 'Mr. Adeyemi Tunde',
    dueDate: '2026-06-10',
    status: 'pending',
    score: null,
    maxScore: 100,
    type: 'test',
  },
  {
    id: '2',
    title: 'English Comprehension',
    subject: 'English',
    teacher: 'Mrs. Funke Okafor',
    dueDate: '2026-06-07',
    status: 'pending',
    score: null,
    maxScore: 50,
    type: 'assignment',
  },
  {
    id: '3',
    title: 'Science End-of-Module Quiz',
    subject: 'Science',
    teacher: 'Mr. Chukwu Emeka',
    dueDate: '2026-05-20',
    status: 'graded',
    score: 42,
    maxScore: 50,
    type: 'quiz',
  },
  {
    id: '4',
    title: 'Mathematics Homework — Fractions',
    subject: 'Mathematics',
    teacher: 'Mr. Adeyemi Tunde',
    dueDate: '2026-05-25',
    status: 'submitted',
    score: null,
    maxScore: 20,
    type: 'homework',
  },
];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function CoursesTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 font-medium">
        {MOCK_COURSES.length} enrolled courses
      </p>
      {MOCK_COURSES.map((course) => (
        <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            {/* Course Thumbnail placeholder */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#001A72]/10 to-[#001A72]/5 flex items-center justify-center shrink-0">
              <BookMarked size={22} className="text-[#001A72]/50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{course.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{course.teacher}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${course.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                  {course.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${course.status === 'completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#001A72] to-[#FFB81C]'}`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleTab() {
  const upcoming = MOCK_SCHEDULE.filter((s) => s.status === 'upcoming');
  const past = MOCK_SCHEDULE.filter((s) => s.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      <div>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Upcoming Sessions</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400 italic p-4 bg-white rounded-xl border border-gray-100">No upcoming sessions scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-blue-600 uppercase">
                    {new Date(s.date).toLocaleDateString('en', { month: 'short' })}
                  </span>
                  <span className="text-lg font-black text-blue-700 leading-tight">
                    {new Date(s.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900">{s.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.teacher}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-gray-700">{s.time}</p>
                  <p className="text-[10px] text-gray-400">{s.duration}</p>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${s.type === 'online' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {s.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      <div>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Past Sessions</h3>
        <div className="space-y-3">
          {past.map((s) => (
            <div key={s.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4 opacity-70">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase">
                  {new Date(s.date).toLocaleDateString('en', { month: 'short' })}
                </span>
                <span className="text-lg font-black text-gray-500 leading-tight">
                  {new Date(s.date).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-600">{s.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.teacher}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-gray-500">{s.time}</p>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-bold">Done</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const data = MOCK_ANALYTICS;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxHours = Math.max(...data.weeklyActivity);

  return (
    <div className="space-y-5">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Overall Grade', value: data.overallGrade, sub: 'This term', color: 'text-[#001A72]', bg: 'bg-[#001A72]/5' },
          { label: 'Attendance', value: `${data.attendanceRate}%`, sub: 'Sessions attended', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Score', value: `${data.avgScore}%`, sub: 'Across all subjects', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Courses', value: data.coursesActive, sub: 'In progress', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: data.coursesCompleted, sub: 'Courses finished', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Hours Learned', value: data.hoursLearned, sub: 'Total this term', color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color} mt-1`}>{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4">This Week's Activity (hours)</h3>
        <div className="flex items-end gap-2 h-24">
          {data.weeklyActivity.map((hours, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all ${hours > 0 ? 'bg-gradient-to-t from-[#001A72] to-[#0028a5]' : 'bg-gray-100'}`}
                  style={{ height: maxHours > 0 ? `${(hours / maxHours) * 100}%` : '8px', minHeight: hours > 0 ? '8px' : '4px' }}
                />
              </div>
              <span className="text-[9px] font-bold text-gray-400">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Scores */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-4">Subject Performance</h3>
        <div className="space-y-4">
          {data.subjects.map((subj) => (
            <div key={subj.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700">{subj.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900">{subj.score}%</span>
                  <div className={`flex items-center gap-0.5 text-[10px] font-bold ${subj.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {subj.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {subj.change}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-[#001A72] to-[#FFB81C] transition-all duration-700"
                  style={{ width: `${subj.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssessmentsTab() {
  const pending = MOCK_ASSESSMENTS.filter((a) => a.status === 'pending');
  const submitted = MOCK_ASSESSMENTS.filter((a) => a.status === 'submitted');
  const graded = MOCK_ASSESSMENTS.filter((a) => a.status === 'graded');

  const typeColors: Record<string, string> = {
    test: 'bg-red-50 text-red-600 border-red-100',
    assignment: 'bg-blue-50 text-blue-600 border-blue-100',
    quiz: 'bg-purple-50 text-purple-600 border-purple-100',
    homework: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  const AssessmentCard = ({ a }: { a: typeof MOCK_ASSESSMENTS[0] }) => (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm ${a.status === 'pending' ? 'border-amber-100' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeColors[a.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
              {a.type}
            </span>
            <span className="text-[9px] font-bold text-gray-400">{a.subject}</span>
          </div>
          <h4 className="font-bold text-sm text-gray-900">{a.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{a.teacher}</p>
        </div>
        <div className="text-right shrink-0">
          {a.status === 'graded' && a.score !== null ? (
            <div>
              <p className="text-xl font-black text-[#001A72]">{a.score}<span className="text-xs text-gray-400 font-normal">/{a.maxScore}</span></p>
              <p className="text-[10px] font-bold text-emerald-600">Graded</p>
            </div>
          ) : a.status === 'submitted' ? (
            <div className="flex items-center gap-1 text-blue-600">
              <Clock size={12} />
              <span className="text-[10px] font-bold">Submitted</span>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold text-amber-600">Due</p>
              <p className="text-xs font-bold text-gray-700">{new Date(a.dueDate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <AlertCircle size={11} /> Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((a) => <AssessmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
      {submitted.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Awaiting Grades ({submitted.length})</h3>
          <div className="space-y-3">
            {submitted.map((a) => <AssessmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
      {graded.length > 0 && (
        <div>
          <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Graded ({graded.length})</h3>
          <div className="space-y-3">
            {graded.map((a) => <AssessmentCard key={a.id} a={a} />)}
          </div>
        </div>
      )}
      {MOCK_ASSESSMENTS.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">No assessments found.</div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = params?.id as string;

  const { data: child, isLoading: loading, error } = useChild(childId);
  const [activeTab, setActiveTab] = useState<Tab>((searchParams?.get('tab') as Tab) || 'courses');

  useEffect(() => {
    const tab = searchParams?.get('tab') as Tab;
    if (tab && TABS.some((t) => t.key === tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (error) {
      toast.error('Could not load child profile');
      router.push('/app/children');
    }
  }, [error, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#001A72]" size={32} />
      </div>
    );
  }

  if (!child) return null;

  const AVATAR_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];
  const color = AVATAR_COLORS[child.id.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push('/app/children')}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#001A72] transition mt-1"
        >
          <ArrowLeft size={14} />
          My Children
        </button>
      </div>

      {/* Child Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#001A72] to-[#0028a5] px-6 py-5">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0`}>
              {`${child.firstName[0]}${child.lastName[0]}`.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-white">{child.firstName} {child.lastName}</h1>
                <span className="text-[10px] font-black bg-[#FFB81C] text-[#001A72] px-2 py-0.5 rounded-full">Student</span>
              </div>
              <p className="text-white/50 text-xs mt-0.5">{child.email}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {child.grade && (
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <GraduationCap size={12} />
                    <span>{child.grade}</span>
                  </div>
                )}
                {child.school && (
                  <div className="flex items-center gap-1.5 text-white/60 text-xs">
                    <School size={12} />
                    <span>{child.school}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === key
                ? 'text-[#001A72] border-[#001A72]'
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-200'
                }`}
            >
              <Icon size={14} className={activeTab === key ? 'text-[#FFB81C]' : 'text-gray-400'} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'courses' && <CoursesTab />}
          {activeTab === 'schedule' && <ScheduleTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'assessments' && <AssessmentsTab />}
        </div>
      </div>
    </div>
  );
}
