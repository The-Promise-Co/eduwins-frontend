/** ============================================================================
 * 1. Constants & Arrays
 * ============================================================================ */
export const LEVELS = ["beginner", "intermediate", "advanced", "all_levels"] as const;

/** ============================================================================
 * 2. Type Aliases (Enums, Statuses, Discriminators)
 * ============================================================================ */
export type CourseLevel = typeof LEVELS[number];
export type CourseStatus = "draft" | "published";
export type LessonType = "video" | "article";

/** ============================================================================
 * 3. Database Entities & Core Interfaces
 * ============================================================================ */
export interface Lesson {
  id?: string;
  module_id: string;
  title: string;
  type: LessonType;

  // video
  video_url?: string | null;
  duration_seconds?: number | null;

  // article
  content?: string | null;

  order_index?: number;
  is_preview?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Module {
  id?: string;
  course_id?: string;
  title: string;
  description?: string | null;
  order_index?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject?: string | { id: string; name: string } | null;
  level: CourseLevel;
  duration_weeks: number;
  price?: number | string | null;
  is_free: boolean;
  status: CourseStatus;
  tags?: string[] | null; // Can be a comma-separated string from DB or array in forms
  thumbnail_url?: string | null;
  created_at?: string;
  updated_at?: string;

  // Additional UI fields
  teacher_name?: string;
  teacher_id?: string;
  rating_avg?: number;
  enrolled_count?: number;
  lesson_count?: number;
  progress_percent?: number;
  progress?: {
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    progressByLesson: Record<string, {
      id: string;
      lessonId: string;
      completed: boolean;
      completedAt?: string | null;
      lastPositionSeconds?: number;
      updatedAt?: string;
    }>;
    lastProgress?: {
      lessonId: string;
      lastPositionSeconds?: number;
    } | null;
  };
  modules?: Module[];
}

/** ============================================================================
 * 4. Form Input & Mutation Payloads
 * ============================================================================ */
export interface CourseFormInput {
  title: string;
  description: string;
  subject: string;
  level: CourseLevel;
  duration_weeks: number;
  price: string;
  is_free: boolean;
  status: CourseStatus;
  tags: string;
  requirements: string;
  what_you_learn: string;
  thumbnail_url: string;
}
