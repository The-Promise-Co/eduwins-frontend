import { TeacherProfile } from '@/misc/types';

export interface TeacherSearchResult extends Partial<TeacherProfile> {
  photo?: string | null;
  full_name?: string;
  baseHourlyRate?: number | string;
  lga?: string;
  students?: number;
  fullName?: string;
  subject?: string;
  ratingAvg?: number | string;
  id: string;
}
