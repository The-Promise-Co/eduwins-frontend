export type Role = 'teacher' | 'parent' | 'admin' | 'ambassador';

export interface User {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  token?: string;
  phoneNumber?: string;
  location?: string;
  avatarUrl?: string;
  name?: string;
  twoFactorEnabled?: boolean;
}

export interface TeacherDocument {
  id: string;
  url: string;
  name: string;
  tags: string[];
  verified: boolean;
  verified_at?: string;
  uploaded_at: string;
}

export interface TeacherProfile extends User {
  subjects: string[];
  bio: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  photo: string | null;
  video_verified: string | null;
  is_verified: boolean;
  documents: TeacherDocument[];
  name?: string;
  subscribersCount?: string | number;
  full_name?: string;
  reviewCount?: number;
  baseHourlyRate?: number;
  yearsExperience?: number | string;
  qualification?: string;
  is_premium?: boolean;
  referralCode?: string;
  referralCount?: number;
  referralDiscount?: number;
  welfareBoost?: number;
  base_hourly_rate?: number;
}

export interface Booking {
  id: string;
  teacherId: string;
  teacherName?: string;
  parentEmail?: string;
  totalSessions: number;
  totalCost: number;
  status: string;
  subject?: string;
  ratePerHour?: number;
  scheduled_time?: string;
  lesson_id?: string | number;
  teacher_name?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'payment';
  status: 'Completed' | 'Pending' | 'Failed';
  description: string;
}

export interface EarningsStat {
  label: string;
  value: string;
  color: string;
  icon: string;
}

export interface ProgressReport {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  subject: string;
  weekStarting: string;
  week_start?: string;
  teacher_name?: string;
  attendance_score?: number;
  skill_improvement_score?: number;
  homework_completion?: number;
  performance_summary?: string;
  notes?: string;
  score?: number;
  comments?: string;
  status: 'Submitted' | 'Draft';
}

export interface PremiumContent {
  id: string;
  title: string;
  description: string;
  price: number;
  type: 'video' | 'material';
  url: string;
  teacherId: string;
  thumbnailUrl?: string;
}

export interface VaultItem {
  id: string | number;
  name?: string;
  title?: string;
  description: string;
  price: number;
  type?: string;
  content_type?: string;
  teacher_name?: string;
  subject?: string;
  rating_avg?: number;
  total_sessions?: number;
  createdAt?: string;
}
