import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/misc/services/api';
import type {
  AssigneeLookupResult,
  Assessment,
  AssessmentAssignment,
  AssessmentAttempt,
  AssessmentFormInput,
  GradeAttemptInput,
  InviteAssignmentInput,
} from '@/misc/types/assessment';

/** One-time cleanup of the scaffold-era mock store (DB is the source of truth). */
function clearAssessmentMockStore() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('eduwins_assessments_mock_v1');
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  clearAssessmentMockStore();
}

/* ------------------------------------------------------------------ */
/* Assessments                                                           */
/* ------------------------------------------------------------------ */

export interface AssessmentFilters {
  status?: string;
  search?: string;
}

export const useAssessments = (filters?: AssessmentFilters) => {
  return useQuery<Assessment[]>({
    queryKey: ['assessments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<Assessment[] | { assessments: Assessment[] }>(`/assessments${qs}`);
      return Array.isArray(res.data) ? res.data : res.data.assessments || [];
    },
  });
};

export const useAssessment = (id: string | undefined) => {
  return useQuery<Assessment>({
    queryKey: ['assessments', id],
    queryFn: async () => {
      const res = await api.get<Assessment>(`/assessments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  return useMutation<Assessment, unknown, AssessmentFormInput>({
    mutationFn: async (input) => {
      const res = await api.post<Assessment>('/assessments', input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessments'] }),
  });
};

export const useUpdateAssessment = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Assessment, unknown, Partial<AssessmentFormInput>>({
    mutationFn: async (input) => {
      const res = await api.put<Assessment>(`/assessments/${id}`, input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', id] });
    },
  });
};

export const usePublishAssessment = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Assessment, unknown, void>({
    mutationFn: async () => {
      const res = await api.post<Assessment>(`/assessments/${id}/publish`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', id] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Invites / assignments                                                 */
/* ------------------------------------------------------------------ */

export const useLookupAssignee = (email: string) => {
  return useQuery<AssigneeLookupResult | null>({
    queryKey: ['assessments', 'lookup', email],
    queryFn: async () => {
      const trimmed = email.trim();
      if (!trimmed.includes('@')) return null;
      const res = await api.get<{ result?: AssigneeLookupResult }>(
        `/assessments/lookup?email=${encodeURIComponent(trimmed)}`,
      );
      return res.data.result || null;
    },
    enabled: email.trim().includes('@') && email.trim().length >= 5,
  });
};

export const useAssessmentAssignments = (assessmentId: string | undefined) => {
  return useQuery<AssessmentAssignment[]>({
    queryKey: ['assessments', assessmentId, 'assignments'],
    queryFn: async () => {
      const res = await api.get<AssessmentAssignment[] | { assignments: AssessmentAssignment[] }>(
        `/assessments/${assessmentId}/assignments`,
      );
      return Array.isArray(res.data) ? res.data : res.data.assignments || [];
    },
    enabled: !!assessmentId,
  });
};

export const useMyAssignments = (enabled = true) => {
  return useQuery<AssessmentAssignment[]>({
    queryKey: ['assessments', 'my-assignments'],
    queryFn: async () => {
      const res = await api.get<AssessmentAssignment[] | { assignments: AssessmentAssignment[] }>(
        '/assessments/my-assignments',
      );
      return Array.isArray(res.data) ? res.data : res.data.assignments || [];
    },
    enabled,
  });
};

export const useInviteToAssessment = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AssessmentAssignment, unknown, InviteAssignmentInput>({
    mutationFn: async (input) => {
      const res = await api.post<AssessmentAssignment>(`/assessments/${assessmentId}/assignments`, input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'my-assignments'] });
    },
  });
};

export const useRevokeAssignment = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: async (assignmentId) => {
      await api.delete(`/assessments/${assessmentId}/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'my-assignments'] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Attempts                                                              */
/* ------------------------------------------------------------------ */

export const useStartAttempt = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AssessmentAttempt, unknown, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }) => {
      const res = await api.post<AssessmentAttempt>(`/assessments/${assessmentId}/attempts`, { assignmentId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId, 'assignments'] });
    },
  });
};

export const useAttempt = (attemptId: string | undefined | null) => {
  return useQuery<AssessmentAttempt>({
    queryKey: ['assessments', 'attempt', attemptId],
    queryFn: async () => {
      const res = await api.get<AssessmentAttempt>(`/attempts/${attemptId}`);
      return res.data;
    },
    enabled: !!attemptId,
  });
};

export const useSaveAttemptAnswers = (attemptId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AssessmentAttempt, unknown, Record<string, string>>({
    mutationFn: async (answers) => {
      const res = await api.put<AssessmentAttempt>(`/attempts/${attemptId}/answers`, { answers });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<AssessmentAttempt>(['assessments', 'attempt', attemptId], data);
    },
  });
};

export const useSubmitAttempt = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AssessmentAttempt, unknown, { attemptId: string; answers: Record<string, string> }>({
    mutationFn: async ({ attemptId, answers }) => {
      const res = await api.post<AssessmentAttempt>(`/attempts/${attemptId}/submit`, { answers });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'attempt', vars.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assessments', 'my-assignments'] });
    },
  });
};

export const useGradeAttempt = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation<AssessmentAttempt, unknown, { attemptId: string } & GradeAttemptInput>({
    mutationFn: async ({ attemptId, scores }) => {
      const res = await api.patch<AssessmentAttempt>(`/attempts/${attemptId}/grade`, { scores });
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['assessments', 'attempt', vars.attemptId] });
      queryClient.invalidateQueries({ queryKey: ['assessments', assessmentId, 'assignments'] });
    },
  });
};
