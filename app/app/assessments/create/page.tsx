'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import { useCreateAssessment } from '@/misc/hooks/api/assessments';
import type { AssessmentQuestion, QuestionType } from '@/misc/types/assessment';
import { QUESTION_TYPE_LABELS } from '@/misc/types/assessment';
import { toast } from 'sonner';

function newQuestion(type: QuestionType): AssessmentQuestion {
  const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === 'mcq_single') {
    return {
      id, prompt: '', type, marks: 5,
      options: [
        { id: 'a', label: '' },
        { id: 'b', label: '' },
        { id: 'c', label: '' },
        { id: 'd', label: '' },
      ],
      correctOptionId: 'a',
    };
  }
  if (type === 'true_false') return { id, prompt: '', type, marks: 2, correctBoolean: true };
  return { id, prompt: '', type, marks: 5 };
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  void params;
  const create = useCreateAssessment();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [dueAt, setDueAt] = useState('');
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);

  const totalMarks = useMemo(
    () => questions.reduce((s, q) => s + (Number(q.marks) || 0), 0),
    [questions],
  );

  const patch = (id: string, p: Partial<AssessmentQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...p } : q)));

  const handleSave = async () => {
    if (!title.trim() || !subject.trim()) {
      toast.error('Title and subject are required');
      return;
    }
    if (questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        dueAt: dueAt || undefined,
        questions,
      });
      toast.success('Assessment created');
      router.push(`/app/assessments/${created.id}`);
    } catch {
      toast.error('Failed to create assessment');
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]';

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="New assessment"
        subtitle={totalMarks > 0 ? `${questions.length} questions · ${totalMarks} marks` : 'Build questions, then publish from the detail page'}
        backHref="/app/assessments"
        rightElement={
          <button
            onClick={handleSave}
            disabled={create.isPending}
            className="flex items-center gap-2 bg-[#001A72] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {create.isPending ? 'Saving...' : 'Save draft'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algebra Mid-Term Quiz" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Instructions for learners..." className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Duration (min)</label>
                <input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Due date</label>
                <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            {(['mcq_single', 'true_false', 'short_answer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setQuestions((qs) => [...qs, newQuestion(t)])}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-white border border-gray-200 rounded-xl hover:border-[#001A72] hover:text-[#001A72] transition"
              >
                <Plus size={12} /> {QUESTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {questions.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-sm font-bold text-gray-500">No questions yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a multiple-choice, true/false, or short-answer question above.</p>
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Q{i + 1} · {QUESTION_TYPE_LABELS[q.type]}
                </p>
                <button
                  onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
                  title="Remove question"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={q.prompt}
                onChange={(e) => patch(q.id, { prompt: e.target.value })}
                rows={2}
                placeholder="Write the question..."
                className={inputCls}
              />
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500">Marks</label>
                <input
                  type="number" min={1} value={q.marks}
                  onChange={(e) => patch(q.id, { marks: Number(e.target.value) })}
                  className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20"
                />
              </div>

              {q.type === 'mcq_single' && (
                <div className="space-y-2">
                  {q.options?.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctOptionId === opt.id}
                        onChange={() => patch(q.id, { correctOptionId: opt.id })}
                        className="accent-[#001A72]"
                      />
                      <input
                        value={opt.label}
                        onChange={(e) =>
                          patch(q.id, { options: q.options?.map((o) => (o.id === opt.id ? { ...o, label: e.target.value } : o)) })
                        }
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                        className={inputCls}
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400">Select the radio for the correct answer.</p>
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-500">Correct answer</label>
                  <select
                    value={String(q.correctBoolean)}
                    onChange={(e) => patch(q.id, { correctBoolean: e.target.value === 'true' })}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {q.type === 'short_answer' && (
                <p className="text-[11px] text-gray-400">Learner writes free text — graded manually by you.</p>
              )}
            </div>
          ))}

          <button
            onClick={() => router.push('/app/assessments')}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft size={13} /> Back to list without saving
          </button>
        </div>
      </div>
    </div>
  );
}
