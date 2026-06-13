import { TeacherProfile } from '@/misc/types';

export interface TeacherSearchResult extends Partial<TeacherProfile> {
  photo?: string | null;
  full_name?: string;
  hourly_rate?: number;
  baseHourlyRate?: number;
  lga?: string;
  students?: number;
  fullName?: string;
  subject?: string;
  id: string;
}
