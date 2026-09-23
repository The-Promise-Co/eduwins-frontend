'use client';

import { useMemo, useState, type ReactElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/misc/context/UserContext';
import { ClipboardList, Clock, CheckCircle2, Trophy, Target, Plus, Loader2, Search } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';
import { AssessmentStatusBadge, AssignmentStatusBadge } from '@/misc/components/assessments/StatusBadges';
import { useAssessments, useMyAssignments } from '@/misc/hooks/api/assessments';

type Tab = 'all' | 'assigned' | 'started' | 'submitted' | 'graded';

export default function AssessmentsPage(): ReactElement {
  const { user } = useUser();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const { data: assessments, isLoading } = useAssessments(isTeacher ? { search } : undefined);
  const { data: assignments } = useMyAssignments(!isTeacher);

  const teacherFiltered = useMemo(() => {
    const list = assessments || [];
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((a) => a.title.toLowerCase().includes(s) || a.subject.toLowerCase().includes(s));
  }, [assessments, search]);

  const studentFiltered = useMemo(() => {
    const list = assignments || [];
    const byTab = activeTab === 'all' ? list : list.filter((a) => a.status === activeTab);
    if (!search) return byTab;
    return byTab;
  }, [assignments, activeTab, search]);

  const pendingCount = (assignments || []).filter((a) => a.status === 'assigned' || a.status === 'started').length;
  const gradedCount = (assignments || []).filter((a) => a.status === 'graded').length;
  const avgScore = useMemo(() => {
    const graded = (assignments || []).filter((a) => a.status === 'graded' && a.score !== null && a.score !== undefined);
    if (!graded.length) return 0;
    return Math.round(graded.reduce((s, a) => s + (a.score || 0), 0) / graded.length);
  }, [assignments]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Assessments"
        subtitle={isTeacher ? 'Create quizzes and track learner performance' : 'Track your quizzes, tests, and performance scores'}
        rightElement={
          isTeacher ? (
            <Link
              href="/app/assessments/create"
              className="flex items-center gap-2 bg-[#001A72] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition"
            >
              <Plus size={14} /> New assessment
            </Link>
          ) : undefined
        }
      />

      {!isTeacher && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={String(assignments?.length || 0)} icon={ClipboardList} color="text-[#001A72]" bg="bg-[#001A72]/5" />
          <StatCard label="Pending" value={String(pendingCount)} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Graded" value={String(gradedCount)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Avg Score" value={`${avgScore}`} icon={Trophy} color="text-purple-600" bg="bg-purple-50" />
        </div>
      )}

      {isTeacher && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={String(assessments?.length || 0)} icon={ClipboardList} color="text-[#001A72]" bg="bg-[#001A72]/5" />
          <StatCard label="Draft" value={String((assessments || []).filter((a) => a.status === 'draft').length)} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Published" value={String((assessments || []).filter((a) => a.status === 'published').length)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Questions" value={String((assessments || []).reduce((s, a) => s + a.questions.length, 0))} icon={Trophy} color="text-purple-600" bg="bg-purple-50" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!isTeacher && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {(['all', 'assigned', 'started', 'submitted', 'graded'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${activeTab === tab ? 'bg-white text-[#001A72] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] w-56"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading assessments...
        </div>
      ) : isTeacher ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {teacherFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                <Target size={36} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-500">No assessments here</p>
              </div>
            ) : teacherFiltered.map((a) => (
              <div
                key={a.id}
                onClick={() => router.push(`/app/assessments/${a.id}`)}
                className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#001A72]/5 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[#001A72]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.subject} · {a.questions.length} questions · {a.durationMinutes} min</p>
                </div>
                <AssessmentStatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {studentFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                <Target size={36} className="text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-500">No assessments here</p>
              </div>
            ) : studentFiltered.map((asg) => (
              <div
                key={asg.id}
                onClick={() => {
                  if (asg.attemptId && (asg.status === 'submitted' || asg.status === 'graded')) {
                    router.push(`/app/assessments/${asg.assessmentId}/results?attemptId=${asg.attemptId}`);
                  } else if (asg.status === 'assigned' || asg.status === 'started') {
                    router.push(`/app/assessments/${asg.assessmentId}`);
                  }
                }}
                className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#001A72]/5 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[#001A72]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{asg.assessmentTitle || 'Assessment'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{asg.assessmentSubject || asg.assigneeType}{asg.assessmentDurationMinutes ? ` · ${asg.assessmentDurationMinutes} min` : ''}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 capitalize">For {asg.assigneeName} ({asg.assigneeType}) · Due: {asg.dueAt ? new Date(asg.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'No due date'}</p>
                  {asg.score !== undefined && asg.score !== null && (asg.status === 'graded') && (
                    <p className="text-[10px] font-black text-emerald-600 mt-0.5">Score: {asg.score}</p>
                  )}
                </div>
                <AssignmentStatusBadge status={asg.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
