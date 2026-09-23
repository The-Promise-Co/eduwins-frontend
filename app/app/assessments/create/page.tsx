'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/misc/components/PageHeader';
import AssessmentBuilderForm from '@/misc/components/assessments/AssessmentBuilderForm';
import { useCreateAssessment } from '@/misc/hooks/api/assessments';
import type { AssessmentFormInput } from '@/misc/types/assessment';
import { toast } from 'sonner';

export default function CreateAssessmentPage() {
  const router = useRouter();
  const create = useCreateAssessment();

  const handleSave = async (input: AssessmentFormInput) => {
    if (!input.title.trim() || !input.subject.trim()) {
      toast.error('Title and subject are required');
      return;
    }
    if (input.questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    try {
      const created = await create.mutateAsync(input);
      toast.success('Assessment created');
      router.push(`/app/assessments/${created.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create assessment');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="New assessment"
        subtitle="Build sections and questions, then publish from the detail page"
        backHref="/app/assessments"
      />
      <AssessmentBuilderForm
        initial={{ title: '', subject: '', description: '', durationMinutes: 30, dueAt: '', questions: [], sections: [] }}
        locked={false}
        saveLabel="Save draft"
        saving={create.isPending}
        onSave={handleSave}
      />
    </div>
  );
}
