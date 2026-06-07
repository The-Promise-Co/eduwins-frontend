import { Course } from '@/misc/types/course';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCourseResponse {
  id: string;
}

export interface AnalyticSnapshot {
  week: string;
  enrollments: number;
  revenue: number;
  views: number;
}

export interface StudentEnrolled {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
  progress_percent: number;
  last_active?: string;
}
