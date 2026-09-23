'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Send, Timer } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import { groupQuestionsBySection } from '@/misc/components/assessments/sectionGroups';
import { useAssessment, useAttempt, useSaveAttemptAnswers, useSubmitAttempt } from '@/misc/hooks/api/assessments';
import { toast } from 'sonner';

function useCountdown(deadlineMs: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!deadlineMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadlineMs]);
  if (!deadlineMs) return null;
  const left = Math.max(0, deadlineMs - now);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TakeAssessmentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const search = useSearchParams();
  const attemptId = search?.get('attemptId') || undefined;
  const router = useRouter();

  const { data: assessment, isLoading: loadingAsm } = useAssessment(id);
  const { data: attempt, isLoading: loadingAtt } = useAttempt(attemptId);
  const saver = useSaveAttemptAnswers(attemptId || '');
  const submitter = useSubmitAttempt(id || '');

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [expired, setExpired] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  answersRef.current = answers;

  useEffect(() => {
    if (attempt?.answers) setAnswers(attempt.answers);
  }, [attempt?.id]);

  const deadline = useMemo(() => {
    if (!assessment || !attempt) return null;
    return new Date(attempt.startedAt).getTime() + assessment.durationMinutes * 60000;
  }, [assessment, attempt]);
  const remaining = useCountdown(deadline);

  const queueAutosave = (next: Record<string, string>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (attemptId) saver.mutate(next);
    }, 1500);
  };

  const set = (qid: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: value };
      queueAutosave(next);
      return next;
    });
  };

  useEffect(() => {
    const flush = () => {
      if (attemptId && Object.keys(answers).length > 0) saver.mutate(answers);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [attemptId, answers, saver]);

  const handleSubmit = async (auto = false) => {
    if (!attemptId || submitter.isPending) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await submitter.mutateAsync({ attemptId, answers: answersRef.current });
      toast.success(auto ? 'Time is up — assessment auto-submitted' : 'Assessment submitted');
      router.push(`/app/assessments/${id}/results?attemptId=${attemptId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to submit');
    }
  };

  // Server submittedAt is authoritative; the countdown only triggers the submit.
  useEffect(() => {
    if (!deadline || expired || !attempt || attempt.status !== 'in_progress') return;
    if (deadline - Date.now() <= 0) {
      setExpired(true);
      void handleSubmit(true);
      return;
    }
    const t = setTimeout(() => {
      setExpired(true);
      void handleSubmit(true);
    }, deadline - Date.now());
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, expired, attempt?.id, attempt?.status]);

  if (loadingAsm || loadingAtt) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading attempt...
        </div>
      </div>
    );
  }

  if (!assessment || !attempt) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
          Attempt not found. Start again from the assessment page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={assessment.title}
        subtitle={`${assessment.subject} · ${assessment.questions.length} questions`}
        backHref={`/app/assessments/${id}`}
        rightElement={
          <span className="flex items-center gap-2 px-4 py-2 bg-[#001A72] text-white text-xs font-black rounded-xl">
            <Timer size={14} /> {remaining || `${assessment.durationMinutes}:00`}
          </span>
        }
      />

      <div className="space-y-5">
        {(() => {
          const renderCard = (q: (typeof assessment.questions)[number], n: number) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Q{n} · {q.marks} marks
              </p>
              <p className="text-sm font-bold text-gray-900 mt-1">{q.prompt}</p>

              {q.type === 'mcq_single' && (
                <div className="mt-3 space-y-2">
                  {q.options?.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${answers[q.id] === opt.id ? 'bg-[#001A72]/5 border-[#001A72] text-[#001A72]' : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => set(q.id, opt.id)}
                        className="accent-[#001A72]"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="mt-3 flex gap-2">
                  {['true', 'false'].map((v) => (
                    <button
                      key={v}
                      onClick={() => set(q.id, v)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase border transition ${answers[q.id] === v ? 'bg-[#001A72] text-white border-[#001A72]' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'short_answer' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => set(q.id, e.target.value)}
                  rows={4}
                  placeholder="Type your answer..."
                  className="mt-3 w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]"
                />
              )}
            </div>
          );

          const hasSections = (assessment.sections || []).length > 0;
          if (!hasSections) {
            return assessment.questions.map((q, i) => renderCard(q, i + 1));
          }
          const { ordered, unassigned } = groupQuestionsBySection(assessment.questions, assessment.sections);
          return (
            <>
              {ordered.map(({ section, items }) => (
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
              {unassigned.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-black text-gray-400 px-1">Unassigned</p>
                  {unassigned.map(({ q, n }) => renderCard(q, n))}
                </div>
              )}
            </>
          );
        })()}

        <button
          onClick={() => handleSubmit(false)}
          disabled={submitter.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#001A72] text-white text-sm font-bold rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
        >
          {submitter.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {submitter.isPending ? 'Submitting...' : 'Submit assessment'}
        </button>
        <p className="text-center text-[11px] text-gray-400">Answers autosave as you type.</p>
      </div>
    </div>
  );
}
