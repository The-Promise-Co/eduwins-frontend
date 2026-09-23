'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, Save, ChevronUp, ChevronDown, FolderPlus } from 'lucide-react';
import type {
  AssessmentFormInput,
  AssessmentQuestion,
  AssessmentSection,
  QuestionType,
} from '@/misc/types/assessment';
import { QUESTION_TYPE_LABELS } from '@/misc/types/assessment';

export interface BuilderInitial {
  title: string;
  subject: string;
  description: string;
  durationMinutes: number;
  dueAt: string;
  questions: AssessmentQuestion[];
  sections: AssessmentSection[];
}

interface AssessmentBuilderFormProps {
  initial: BuilderInitial;
  /** True when question/section structure is locked (published + active invites). Metadata stays editable. */
  locked: boolean;
  lockNotice?: string;
  saveLabel: string;
  saving: boolean;
  onSave: (input: AssessmentFormInput) => Promise<void>;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function newQuestion(type: QuestionType, sectionId: string | null): AssessmentQuestion {
  const id = uid('q');
  const base = { id, prompt: '', sectionId, marks: type === 'true_false' ? 2 : 5 };
  if (type === 'mcq_single') {
    return {
      ...base,
      type,
      options: [
        { id: 'a', label: '' },
        { id: 'b', label: '' },
        { id: 'c', label: '' },
        { id: 'd', label: '' },
      ],
      correctOptionId: 'a',
    };
  }
  if (type === 'true_false') return { ...base, type, correctBoolean: true };
  return { ...base, type };
}

const inputCls =
  'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]';

const QUESTION_TYPES = ['mcq_single', 'true_false', 'short_answer'] as const;

export default function AssessmentBuilderForm({
  initial,
  locked,
  lockNotice,
  saveLabel,
  saving,
  onSave,
}: AssessmentBuilderFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [subject, setSubject] = useState(initial.subject);
  const [description, setDescription] = useState(initial.description);
  const [durationMinutes, setDurationMinutes] = useState(initial.durationMinutes);
  const [dueAt, setDueAt] = useState(initial.dueAt);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(initial.questions);
  const [sections, setSections] = useState<AssessmentSection[]>(initial.sections);

  const totalMarks = useMemo(
    () => questions.reduce((s, q) => s + (Number(q.marks) || 0), 0),
    [questions],
  );

  /** Ordered groups: sections in order, then unassigned. Each item carries its global number. */
  const groups = useMemo(() => {
    let n = 0;
    const ordered = sections.map((sec) => {
      const qs = questions
        .map((q, qi) => ({ q, qi }))
        .filter(({ q }) => q.sectionId === sec.id)
        .map(({ q, qi }) => ({ q, qi, n: ++n }));
      const marks = qs.reduce((s, { q }) => s + (Number(q.marks) || 0), 0);
      return { section: sec, items: qs, marks };
    });
    const unassigned = questions
      .map((q, qi) => ({ q, qi }))
      .filter(({ q }) => !q.sectionId || !sections.some((s) => s.id === q.sectionId))
      .map(({ q, qi }) => ({ q, qi, n: ++n }));
    return { ordered, unassigned };
  }, [questions, sections]);

  const patchQuestion = (id: string, p: Partial<AssessmentQuestion>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...p } : q)));

  const addQuestion = (type: QuestionType, sectionId: string | null) =>
    setQuestions((qs) => [...qs, newQuestion(type, sectionId)]);

  const addSection = () =>
    setSections((ss) => [...ss, { id: uid('sec'), title: `Section ${String.fromCharCode(65 + ss.length)}`, instructions: null, orderIndex: ss.length }]);

  const patchSection = (id: string, p: Partial<AssessmentSection>) =>
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const moveSection = (id: string, dir: -1 | 1) =>
    setSections((ss) => {
      const i = ss.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((s, k) => ({ ...s, orderIndex: k }));
    });

  const deleteSection = (id: string) => {
    // Questions are orphaned to unassigned (never deleted with the section).
    setQuestions((qs) => qs.map((q) => (q.sectionId === id ? { ...q, sectionId: null } : q)));
    setSections((ss) => ss.filter((s) => s.id !== id).map((s, k) => ({ ...s, orderIndex: k })));
  };

  const handleSave = () =>
    onSave({
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim() || undefined,
      durationMinutes,
      dueAt: dueAt || undefined,
      questions,
      sections: sections.map((s, i) => ({ ...s, orderIndex: i })),
    });

  const renderQuestionCard = (q: AssessmentQuestion, n: number) => (
    <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Q{n} · {QUESTION_TYPE_LABELS[q.type]}
        </p>
        {!locked && (
          <button
            onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition"
            title="Remove question"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <textarea
        value={q.prompt}
        onChange={(e) => patchQuestion(q.id, { prompt: e.target.value })}
        rows={2}
        placeholder="Write the question..."
        disabled={locked}
        className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-500`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">Marks</label>
          <input
            type="number" min={1} value={q.marks}
            onChange={(e) => patchQuestion(q.id, { marks: Number(e.target.value) })}
            disabled={locked}
            className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 disabled:bg-gray-50"
          />
        </div>
        {sections.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500">Section</label>
            <select
              value={q.sectionId || ''}
              onChange={(e) => patchQuestion(q.id, { sectionId: e.target.value || null })}
              disabled={locked}
              className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 disabled:bg-gray-50"
            >
              <option value="">Unassigned</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {q.type === 'mcq_single' && (
        <div className="space-y-2">
          {q.options?.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.correctOptionId === opt.id}
                onChange={() => patchQuestion(q.id, { correctOptionId: opt.id })}
                disabled={locked}
                className="accent-[#001A72]"
              />
              <input
                value={opt.label}
                onChange={(e) =>
                  patchQuestion(q.id, { options: q.options?.map((o) => (o.id === opt.id ? { ...o, label: e.target.value } : o)) })
                }
                placeholder={`Option ${opt.id.toUpperCase()}`}
                disabled={locked}
                className={`${inputCls} disabled:bg-gray-50`}
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
            onChange={(e) => patchQuestion(q.id, { correctBoolean: e.target.value === 'true' })}
            disabled={locked}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 disabled:bg-gray-50"
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
  );

  const renderAddButtons = (sectionId: string | null) => {
    if (locked) return null;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {QUESTION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => addQuestion(t, sectionId)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold bg-white border border-gray-200 rounded-xl hover:border-[#001A72] hover:text-[#001A72] transition"
          >
            <Plus size={12} /> {QUESTION_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 lg:sticky lg:top-6">
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#001A72] text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : saveLabel}
          </button>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-5">
        {locked && lockNotice && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-amber-800">{lockNotice}</p>
          </div>
        )}

        {/* Section manager */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Sections ({sections.length})
            </p>
            {!locked && (
              <button
                onClick={addSection}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#001A72] bg-[#001A72]/5 rounded-xl hover:bg-[#001A72]/10 transition"
              >
                <FolderPlus size={13} /> Add section
              </button>
            )}
          </div>
          {sections.length === 0 ? (
            <p className="text-[11px] text-gray-400">
              No sections — questions appear as one flat list. Add a section for exam-style grouping (Section A, B, C…).
            </p>
          ) : (
            sections.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={s.title}
                    onChange={(e) => patchSection(s.id, { title: e.target.value })}
                    disabled={locked}
                    placeholder="Section title"
                    className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 disabled:bg-gray-50"
                  />
                  {!locked && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveSection(s.id, -1)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition" title="Move up">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => moveSection(s.id, 1)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition" title="Move down">
                        <ChevronDown size={14} />
                      </button>
                      <button onClick={() => deleteSection(s.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition" title="Delete section (questions become unassigned)">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  value={s.instructions || ''}
                  onChange={(e) => patchSection(s.id, { instructions: e.target.value || null })}
                  disabled={locked}
                  placeholder="Instructions for this section (optional)"
                  className="w-full px-3 py-2 text-[11px] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 disabled:bg-gray-50"
                />
              </div>
            ))
          )}
        </div>

        {/* Questions */}
        {sections.length === 0 && renderAddButtons(null)}
        {sections.length === 0 && questions.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-sm font-bold text-gray-500">No questions yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a multiple-choice, true/false, or short-answer question above.</p>
          </div>
        )}

        {groups.ordered.map(({ section, items, marks }) => (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-gray-900">
                {section.title}
                <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase">
                  {items.length} question{items.length === 1 ? '' : 's'} · {marks} marks
                </span>
              </p>
            </div>
            {renderAddButtons(section.id)}
            {items.map(({ q, n }) => renderQuestionCard(q, n))}
          </div>
        ))}

        {(sections.length > 0) && (
          <div className="space-y-3">
            <p className="text-sm font-black text-gray-400">
              Unassigned
              <span className="ml-2 text-[10px] font-bold uppercase">
                {groups.unassigned.length} question{groups.unassigned.length === 1 ? '' : 's'}
              </span>
            </p>
            {renderAddButtons(null)}
            {groups.unassigned.map(({ q, n }) => renderQuestionCard(q, n))}
          </div>
        )}
      </div>
    </div>
  );
}
