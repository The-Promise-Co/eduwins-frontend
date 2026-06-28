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

type ChildCourse = {
  id: string;
  title: string;
  teacher: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  status: 'active' | 'completed';
};

type ChildScheduleItem = {
  id: string;
  subject: string;
  teacher: string;
  date: string;
  time: string;
  duration: string;
  status: 'upcoming' | 'completed';
  type: string;
};

type ChildAssessment = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score: number | null;
  maxScore: number;
  type: string;
};

const childCourses: ChildCourse[] = [];
const childSchedule: ChildScheduleItem[] = [];
const childAssessments: ChildAssessment[] = [];

/* ─── Sub-components ────────────────────────────────────────────────────────── */

function CoursesTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 font-medium">
        {childCourses.length} enrolled courses
      </p>
      {childCourses.length === 0 && <EmptyState text="No enrolled courses found for this child." />}
      {childCourses.map((course) => (
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
  const upcoming = childSchedule.filter((s) => s.status === 'upcoming');
  const past = childSchedule.filter((s) => s.status === 'completed');

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
        {past.length === 0 ? (
          <p className="text-sm text-gray-400 italic p-4 bg-white rounded-xl border border-gray-100">No past sessions found.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  return (
    <EmptyState text="Analytics will appear once the child has completed learning activity." />
  );
}

function AssessmentsTab() {
  const pending = childAssessments.filter((a) => a.status === 'pending');
  const submitted = childAssessments.filter((a) => a.status === 'submitted');
  const graded = childAssessments.filter((a) => a.status === 'graded');

  const typeColors: Record<string, string> = {
    test: 'bg-red-50 text-red-600 border-red-100',
    assignment: 'bg-blue-50 text-blue-600 border-blue-100',
    quiz: 'bg-purple-50 text-purple-600 border-purple-100',
    homework: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  const AssessmentCard = ({ a }: { a: ChildAssessment }) => (
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
      {childAssessments.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">No assessments found.</div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">{text}</div>;
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
