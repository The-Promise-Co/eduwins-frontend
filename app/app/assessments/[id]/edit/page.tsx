'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import AssessmentBuilderForm from '@/misc/components/assessments/AssessmentBuilderForm';
import {
  useAssessment,
  useUpdateAssessment,
  useAssessmentAssignments,
} from '@/misc/hooks/api/assessments';
import type { AssessmentFormInput } from '@/misc/types/assessment';
import { toast } from 'sonner';

function toLocalInput(dueAt?: string | null) {
  if (!dueAt) return '';
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditAssessmentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { data: assessment, isLoading } = useAssessment(id);
  const { data: assignments } = useAssessmentAssignments(id);
  const update = useUpdateAssessment(id || '');

  const activeInvites = useMemo(
    () => (assignments || []).filter((a) => a.status !== 'revoked').length,
    [assignments],
  );
  // Structure (questions + section add/remove/reorder) locks once invites go
  // out. Metadata + section title/instructions stay editable.
  const locked = (assessment?.status !== 'draft' && activeInvites > 0) || false;

  const handleSave = async (input: AssessmentFormInput) => {
    if (!input.title.trim() || !input.subject.trim()) {
      toast.error('Title and subject are required');
      return;
    }
    try {
      const dueAt = input.dueAt ? new Date(input.dueAt).toISOString() : undefined;
      // Locked: questions are omitted so the backend lock never trips on
      // unchanged data; section title/instructions edits still go through.
      const payload = locked
        ? {
            title: input.title,
            subject: input.subject,
            description: input.description,
            durationMinutes: input.durationMinutes,
            dueAt,
            sections: input.sections,
          }
        : { ...input, dueAt };
      await update.mutateAsync(payload);
      toast.success('Assessment updated');
      router.push(`/app/assessments/${id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update assessment');
    }
  };

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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Edit — ${assessment.title}`}
        subtitle={locked ? `${activeInvites} active invite${activeInvites === 1 ? '' : 's'} · structure locked` : 'All fields editable'}
        backHref={`/app/assessments/${id}`}
      />
      <AssessmentBuilderForm
        key={assessment.id + (assessment.updatedAt || '')}
        initial={{
          title: assessment.title,
          subject: assessment.subject,
          description: assessment.description || '',
          durationMinutes: assessment.durationMinutes,
          dueAt: toLocalInput(assessment.dueAt),
          questions: assessment.questions,
          sections: assessment.sections || [],
        }}
        locked={locked}
        lockNotice="Invites have been sent — questions and section structure are locked to protect submitted work. You can still edit metadata and section titles/instructions."
        saveLabel="Save changes"
        saving={update.isPending}
        onSave={handleSave}
      />
    </div>
  );
}
