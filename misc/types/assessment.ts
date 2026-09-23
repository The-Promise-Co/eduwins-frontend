/** Assessment module — shared types (frontend-first, mirrors planned backend contract). */

export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'mcq_single' | 'true_false' | 'short_answer';
export type AssigneeType = 'parent' | 'child';
export type AssignmentStatus = 'assigned' | 'started' | 'submitted' | 'graded' | 'revoked';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  instructions?: string | null;
  orderIndex: number;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  marks: number;
  options?: QuestionOption[];
  correctOptionId?: string;
  correctBoolean?: boolean;
  sectionId?: string | null;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  description?: string | null;
  durationMinutes: number;
  totalMarks: number;
  dueAt?: string | null;
  status: AssessmentStatus;
  questions: AssessmentQuestion[];
  sections: AssessmentSection[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentFormInput {
  title: string;
  subject: string;
  description?: string;
  durationMinutes: number;
  dueAt?: string;
  questions: AssessmentQuestion[];
  sections: AssessmentSection[];
}

export interface AssigneeLookupResult {
  kind: AssigneeType;
  id: string;
  name: string;
  email: string;
  parentName?: string;
}

export interface AssessmentAssignment {
  id: string;
  assessmentId: string;
  assigneeType: AssigneeType;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  dueAt?: string | null;
  status: AssignmentStatus;
  score?: number | null;
  attemptId?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  assessmentTitle?: string;
  assessmentSubject?: string;
  assessmentDurationMinutes?: number;
}

export interface InviteAssignmentInput {
  assigneeType: AssigneeType;
  assigneeId: string;
  dueAt?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  assignmentId: string;
  answers: Record<string, string>;
  score?: number | null;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
}

export interface GradeAttemptInput {
  scores: Record<string, number>;
  feedback?: string;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq_single: 'Multiple choice',
  true_false: 'True / False',
  short_answer: 'Short answer',
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  assigned: 'Assigned',
  started: 'Started',
  submitted: 'Submitted',
  graded: 'Graded',
  revoked: 'Revoked',
};
