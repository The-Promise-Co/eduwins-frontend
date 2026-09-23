'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Undo2, Loader2 } from 'lucide-react';
import Modal from '@/misc/components/Modal';
import { AssignmentStatusBadge } from '@/misc/components/assessments/StatusBadges';
import { useAssessmentAssignments, useRevokeAssignment } from '@/misc/hooks/api/assessments';
import type { AssessmentAssignment } from '@/misc/types/assessment';
import { toast } from 'sonner';

function formatDue(value?: string | null) {
  if (!value) return 'No due date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function InvitesList({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const { data: invites, isLoading } = useAssessmentAssignments(assessmentId);
  const revoke = useRevokeAssignment(assessmentId);
  const [pendingRevoke, setPendingRevoke] = useState<AssessmentAssignment | null>(null);

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    try {
      await revoke.mutateAsync(pendingRevoke.id);
      toast.success(`Invite to ${pendingRevoke.assigneeName} revoked`);
      setPendingRevoke(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to revoke invite');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Loading invites...
      </div>
    );
  }

  if (!invites || invites.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <p className="text-sm font-bold text-gray-500">No invites yet</p>
        <p className="text-xs text-gray-400 mt-1">Send this assessment to a parent or child to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {invites.map((invite) => {
            const revoked = invite.status === 'revoked';
            const locked = invite.status === 'submitted' || invite.status === 'graded';
            const canRevoke = !revoked && !locked;
            const canOpen = !revoked && !!invite.attemptId;
            return (
              <div
                key={invite.id}
                onClick={() => {
                  if (canOpen) router.push(`/app/assessments/${assessmentId}/results?attemptId=${invite.attemptId}`);
                }}
                className={`px-6 py-4 flex items-center gap-4 transition-colors ${canOpen ? 'hover:bg-gray-50/70 cursor-pointer' : ''} ${revoked ? 'opacity-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-[#001A72]/5 flex items-center justify-center shrink-0 text-xs font-black text-[#001A72]">
                  {invite.assigneeName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{invite.assigneeName}</p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {invite.assigneeEmail} · <span className="capitalize">{invite.assigneeType}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Due: {formatDue(invite.dueAt)}
                    {invite.score !== undefined && invite.score !== null && (
                      <span className="ml-2 font-black text-emerald-600">Score: {invite.score}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <AssignmentStatusBadge status={invite.status} />
                  {canOpen && <ChevronRight size={16} className="text-gray-300" />}
                  {canRevoke && (
                    <button
                      onClick={() => setPendingRevoke(invite)}
                      title="Revoke invite"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Undo2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={!!pendingRevoke}
        onClose={() => setPendingRevoke(null)}
        title="Revoke invite?"
        subtitle={pendingRevoke ? `${pendingRevoke.assigneeName} will lose access to this assessment.` : undefined}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setPendingRevoke(null)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
            >
              Keep invite
            </button>
            <button
              onClick={confirmRevoke}
              disabled={revoke.isPending}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-50"
            >
              {revoke.isPending ? 'Revoking...' : 'Revoke invite'}
            </button>
          </>
        }
      >
        <p className="text-xs text-gray-500">
          Revoked invites stay in this list for audit but the learner can no longer start or submit. This cannot be
          undone — you can always send a fresh invite afterwards.
        </p>
      </Modal>
    </>
  );
}
