'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/misc/context/UserContext';
import PageHeader from '@/misc/components/PageHeader';
import ResultsView from '@/misc/components/assessments/ResultsView';
import { useAssessment } from '@/misc/hooks/api/assessments';

export default function AssessmentResultsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const search = useSearchParams();
  const attemptId = search?.get('attemptId') || '';
  const { user } = useUser();
  const isTeacher = user?.role === 'teacher';

  const { data: assessment, isLoading } = useAssessment(id);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Loading results...
        </div>
      </div>
    );
  }

  if (!assessment || !attemptId) {
    return (
      <div className="space-y-6 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
          {!assessment ? 'Assessment not found.' : 'Pick an invite from the detail page to view its answers.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`${assessment.title} — results`}
        subtitle={`${assessment.subject} · ${assessment.totalMarks} marks`}
        backHref={`/app/assessments/${id}`}
      />
      <ResultsView assessment={assessment} attemptId={attemptId} teacherMode={isTeacher} />
    </div>
  );
}
