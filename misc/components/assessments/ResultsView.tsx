'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useAttempt, useGradeAttempt } from '@/misc/hooks/api/assessments';
import { groupQuestionsBySection } from '@/misc/components/assessments/sectionGroups';
import type { Assessment, AssessmentQuestion } from '@/misc/types/assessment';
import { QUESTION_TYPE_LABELS } from '@/misc/types/assessment';
import { toast } from 'sonner';

interface ResultsViewProps {
  assessment: Assessment;
  attemptId: string;
  teacherMode?: boolean;
}

export default function ResultsView({ assessment, attemptId, teacherMode = false }: ResultsViewProps) {
  const { data: attempt, isLoading } = useAttempt(attemptId);
  const grade = useGradeAttempt(assessment.id);
  const [manual, setManual] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Loading answers...
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
        Attempt not found.
      </div>
    );
  }

  const handleGrade = async () => {
    try {
      await grade.mutateAsync({ attemptId, scores: manual });
      toast.success('Grades saved');
    } catch {
      toast.error('Failed to save grades');
    }
  };

  const needsGrading = assessment.questions.some((q) => q.type === 'short_answer') && attempt.status !== 'graded';

  const renderCard = (q: AssessmentQuestion, n: number) => {
    const given = attempt.answers[q.id] || '';
    const isAuto = q.type !== 'short_answer';
    const correct =
      q.type === 'mcq_single'
        ? given === q.correctOptionId
        : q.type === 'true_false'
          ? String(q.correctBoolean) === given
          : null;
    return (
      <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Q{n} · {QUESTION_TYPE_LABELS[q.type]} · {q.marks} marks
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">{q.prompt}</p>
          </div>
          {isAuto && correct !== null && (
            <span
              className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full border ${correct ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {correct ? `+${q.marks}` : '0'}
            </span>
          )}
        </div>

        {q.type === 'mcq_single' && (
          <div className="mt-3 space-y-2">
            {q.options?.map((opt) => {
              const selected = given === opt.id;
              const isCorrect = q.correctOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : selected ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                >
                  {opt.label}
                  {isCorrect && ' ✓'}
                </div>
              );
            })}
          </div>
        )}
        {q.type === 'true_false' && (
          <p className="mt-3 text-xs font-semibold text-gray-700">
            Answer: <span className="font-black">{given || '—'}</span>
            <span className="text-gray-400"> · Correct: {String(q.correctBoolean)}</span>
          </p>
        )}
        {q.type === 'short_answer' && (
          <div className="mt-3">
            <p className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 whitespace-pre-wrap">
              {given || <span className="text-gray-400">No answer given</span>}
            </p>
            {teacherMode && attempt.status !== 'graded' && (
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500">Marks (max {q.marks})</label>
                <input
                  type="number"
                  min={0}
                  max={q.marks}
                  value={manual[q.id] ?? ''}
                  onChange={(e) => setManual((m) => ({ ...m, [q.id]: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const hasSections = (assessment.sections || []).length > 0;
  const grouped = hasSections ? groupQuestionsBySection(assessment.questions, assessment.sections) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {attempt.status === 'graded' ? 'Final score' : 'Auto-graded score (short answers pending)'}
          </p>
          <p className="text-3xl font-black text-gray-900">
            {attempt.score ?? '—'}
            <span className="text-sm font-bold text-gray-400"> / {assessment.totalMarks}</span>
          </p>
        </div>
      </div>

      {!grouped && assessment.questions.map((q, i) => renderCard(q, i + 1))}

      {grouped && (
        <>
          {grouped.ordered.map(({ section, items }) => (
            <div key={section.id} className="space-y-3">
              <div className="bg-[#001A72]/5 border border-[#001A72]/10 rounded-2xl px-5 py-4">
                <p className="text-sm font-black text-[#001A72]">{section.title}</p>
                {section.instructions && (
                  <p className="text-xs text-gray-500 mt-1">{section.instructions}</p>
                )}
              </div>
              {items.map(({ q, n }) => renderCard(q, n))}
            </div>
          ))}
          {grouped.unassigned.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-black text-gray-400 px-1">Unassigned</p>
              {grouped.unassigned.map(({ q, n }) => renderCard(q, n))}
            </div>
          )}
        </>
      )}

      {teacherMode && needsGrading && (
        <button
          onClick={handleGrade}
          disabled={grade.isPending}
          className="w-full py-3 bg-[#001A72] text-white text-sm font-bold rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
        >
          {grade.isPending ? 'Saving...' : 'Save short-answer grades'}
        </button>
      )}
    </div>
  );
}
