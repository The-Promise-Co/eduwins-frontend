'use client';

import { useState, ReactElement } from 'react';
import { useUser } from '@/misc/context/UserContext';
import { ClipboardList, Clock, CheckCircle2, XCircle, ChevronRight, Trophy, Target } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';

interface Assessment {
  id: number;
  title: string;
  subject: string;
  dueDate: string;
  duration: string;
  status: 'pending' | 'completed' | 'missed';
  score?: number;
  totalMarks: number;
}

const ASSESSMENTS: Assessment[] = [
  { id: 1, title: 'Algebra Mid-Term Quiz', subject: 'Mathematics', dueDate: 'May 12, 2026', duration: '45 min', status: 'pending', totalMarks: 100 },
  { id: 2, title: 'Grammar & Comprehension', subject: 'English', dueDate: 'May 10, 2026', duration: '30 min', status: 'completed', score: 84, totalMarks: 100 },
  { id: 3, title: 'Newton\'s Laws Test', subject: 'Physics', dueDate: 'May 8, 2026', duration: '60 min', status: 'completed', score: 91, totalMarks: 100 },
  { id: 4, title: 'Periodic Table Quiz', subject: 'Chemistry', dueDate: 'May 5, 2026', duration: '20 min', status: 'missed', totalMarks: 50 },
  { id: 5, title: 'Cell Biology Assessment', subject: 'Biology', dueDate: 'May 15, 2026', duration: '40 min', status: 'pending', totalMarks: 100 },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  missed: { label: 'Missed', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
};

export default function AssessmentsPage(): ReactElement {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');

  const filtered = activeTab === 'all' ? ASSESSMENTS : ASSESSMENTS.filter((a) => a.status === activeTab);
  const completed = ASSESSMENTS.filter((a) => a.status === 'completed');
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, a) => sum + (a.score! / a.totalMarks) * 100, 0) / completed.length)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Assessments"
        subtitle="Track your quizzes, tests, and performance scores"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(ASSESSMENTS.length)} icon={ClipboardList} color="text-[#001A72]" bg="bg-[#001A72]/5" />
        <StatCard label="Pending" value={String(ASSESSMENTS.filter(a => a.status === 'pending').length)} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Completed" value={String(completed.length)} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Avg Score" value={`${avgScore}%`} icon={Trophy} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['all', 'pending', 'completed', 'missed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${activeTab === tab
              ? 'bg-white text-[#001A72] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assessment list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
              <Target size={36} className="text-gray-400 mb-3" />
              <p className="text-sm font-bold text-gray-500">No assessments here</p>
            </div>
          ) : filtered.map((assessment) => {
            const cfg = STATUS_CONFIG[assessment.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={assessment.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#001A72]/5 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} className="text-[#001A72]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{assessment.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{assessment.subject}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-gray-400">Due: {assessment.dueDate}</span>
                    <span className="text-[10px] text-gray-400">{assessment.duration}</span>
                    {assessment.status === 'completed' && assessment.score !== undefined && (
                      <span className="text-[10px] font-black text-emerald-600">
                        {assessment.score}/{assessment.totalMarks}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${cfg.color}`}>
                    <StatusIcon size={9} /> {cfg.label}
                  </span>
                  {assessment.status === 'pending' && (
                    <button className="flex items-center gap-1 bg-[#001A72] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#001A72]/90 transition">
                      Start <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
