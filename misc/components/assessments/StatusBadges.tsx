'use client';

import { CheckCircle2, Clock, FileX2, Send, PenLine, Trophy } from 'lucide-react';
import type { AssignmentStatus, AssessmentStatus } from '@/misc/types/assessment';
import { ASSIGNMENT_STATUS_LABELS } from '@/misc/types/assessment';

const ASSIGNMENT_STYLES: Record<AssignmentStatus, string> = {
  assigned: 'bg-amber-50 text-amber-700 border-amber-100',
  started: 'bg-blue-50 text-blue-700 border-blue-100',
  submitted: 'bg-violet-50 text-violet-700 border-violet-100',
  graded: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  revoked: 'bg-gray-100 text-gray-500 border-gray-200',
};

const ASSIGNMENT_ICONS = {
  assigned: Send,
  started: PenLine,
  submitted: Clock,
  graded: Trophy,
  revoked: FileX2,
} as const;

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const Icon = ASSIGNMENT_ICONS[status] || Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ASSIGNMENT_STYLES[status]}`}
    >
      <Icon size={9} /> {ASSIGNMENT_STATUS_LABELS[status]}
    </span>
  );
}

const ASSESSMENT_STYLES: Record<AssessmentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-red-50 text-red-600 border-red-100',
};

export function AssessmentStatusBadge({ status }: { status: AssessmentStatus }) {
  const Icon = status === 'published' ? CheckCircle2 : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ASSESSMENT_STYLES[status]}`}
    >
      <Icon size={9} /> {status}
    </span>
  );
}
