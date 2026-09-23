'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/misc/context/UserContext';
import { Clock, ListChecks, Send, Play, Loader2, Megaphone } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import { AssessmentStatusBadge } from '@/misc/components/assessments/StatusBadges';
import InviteModal from '@/misc/components/assessments/InviteModal';
import InvitesList from '@/misc/components/assessments/InvitesList';
import { useAssessment, usePublishAssessment, useStartAttempt, useAssessmentAssignments, useMyAssignments } from '@/misc/hooks/api/assessments';
import { QUESTION_TYPE_LABELS } from '@/misc/types/assessment';
import { toast } from 'sonner';

function formatDue(value?: string | null) {
  if (!value) return 'No due date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user } = useUser();
  const router = useRouter();
  const isTeacher = user?.role === 'teacher';
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: assessment, isLoading } = useAssessment(id);
  const { data: assignments } = useAssessmentAssignments(isTeacher ? id : undefined);
  const { data: myAssignments } = useMyAssignments(!isTeacher);
  const publish = usePublishAssessment(id || '');
  const startAttempt = useStartAttempt(id || '');

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading assessment...
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
          Assessment not found.
        </div>
      </div>
    );
  }

  const myAssignment = isTeacher
    ? undefined
    : (myAssignments || []).find((a) => a.assessmentId === id && a.status !== 'revoked');
  const activeInviteCount = (assignments || []).filter((a) => a.status !== 'revoked').length;

  const handlePublish = async () => {
    try {
      await publish.mutateAsync();
      toast.success('Assessment published');
    } catch {
      toast.error('Failed to publish');
    }
  };

  const handleStart = async () => {
    if (!myAssignment) {
      toast.error("You haven't been invited to this assessment");
      return;
    }
    if (myAssignment.status === 'submitted' || myAssignment.status === 'graded') {
      if (myAssignment.attemptId) {
        router.push(`/app/assessments/${assessment.id}/results?attemptId=${myAssignment.attemptId}`);
      }
      return;
    }
    try {
      const attempt = await startAttempt.mutateAsync({ assignmentId: myAssignment.id });
      router.push(`/app/assessments/${assessment.id}/take?attemptId=${attempt.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Could not start attempt');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={assessment.title}
        subtitle={`${assessment.subject} · ${assessment.durationMinutes} min · ${assessment.totalMarks} marks`}
        backHref="/app/assessments"
        rightElement={
          isTeacher ? (
            <div className="flex items-center gap-2">
              {assessment.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  disabled={publish.isPending}
                  className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Megaphone size={14} /> {publish.isPending ? 'Publishing...' : 'Publish'}
                </button>
              )}
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-2 bg-[#001A72] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition"
              >
                <Send size={14} /> Send / Invite
              </button>
            </div>
          ) : myAssignment ? (
            <button
              onClick={handleStart}
              disabled={startAttempt.isPending}
              className="flex items-center gap-2 bg-[#001A72] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
            >
              <Play size={14} />{' '}
              {startAttempt.isPending
                ? 'Starting...'
                : myAssignment.status === 'submitted' || myAssignment.status === 'graded'
                  ? 'View results'
                  : myAssignment.status === 'started'
                    ? 'Resume assessment'
                    : 'Start assessment'}
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <AssessmentStatusBadge status={assessment.status} />
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Clock size={12} /> Due: {formatDue(assessment.dueAt)}
              </span>
            </div>
            {assessment.description && (
              <p className="text-sm text-gray-600 mt-4">{assessment.description}</p>
            )}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-gray-900">{assessment.questions.length}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Questions</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-gray-900">{assessment.durationMinutes}m</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-gray-900">{assessment.totalMarks}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Marks</p>
              </div>
            </div>
            {isTeacher && (
              <p className="text-[11px] text-gray-400 mt-4">
                {activeInviteCount} active invite{activeInviteCount === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <ListChecks size={16} /> Questions ({assessment.questions.length})
          </h2>
          {assessment.questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              No questions yet.
            </div>
          ) : (
            assessment.questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Q{i + 1} · {QUESTION_TYPE_LABELS[q.type]} · {q.marks} marks
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">{q.prompt}</p>
                {q.type === 'mcq_single' && q.options && (
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((o) => (
                      <p key={o.id} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        {o.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isTeacher && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-gray-900">Invites</h2>
          <InvitesList assessmentId={assessment.id} />
        </div>
      )}

      {isTeacher && id && (
        <InviteModal assessmentId={id} isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}
