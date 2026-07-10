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

export interface TeacherCertification {
  id?: string | number;
  certificationName: string;
  issuingOrganization: string;
  credentialId?: string | null;
  credentialUrl?: string | null;
  imageUrl?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  doesNotExpire?: boolean;
  description?: string | null;
}

export interface TeacherEducation {
  id?: string | number;
  institutionName: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  grade?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  description?: string | null;
}

export interface TeacherProfile extends Partial<User> {
  id: string;
  userId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  subjects: string[];
  subject?: string;
  bio?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
  documents?: TeacherDocument[];
  name?: string;
  languages?: string[];
  subscribersCount?: string | number;
  full_name?: string;
  ratingAvg?: number | string;
  reviewsCount?: number;
  reviewCount?: number;
  students?: number;
  totalSessions?: number;
  baseHourlyRate?: number | string;
  hourlyRate?: number | string;
  qualification?: string | null;
  highestDegree?: string | null;
  institution?: string | null;
  yearsOfExperience?: number | null;
  certifications?: TeacherCertification[];
  education?: TeacherEducation[];
  intro_video?: string | null;
  isVerified?: boolean;
  educationLevels?: string[];
  sessionFormats?: string[];
  sessionDurations?: number[];
  deliveryModes?: string[];
  availability?: boolean;
  availabilityConfig?: Record<string, { from: string; to: string }[]> | null;
  timezone?: string | null;
  lga?: string;
  location?: string;
  is_premium?: boolean;
  referralCode?: string;
  referralCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  parentId?: string;
  teacherId: string;
  childId?: string | null;
  teacherName?: string;
  parentEmail?: string;
  totalSessions: number;
  totalCost: number;
  totalAmount?: string | number;
  status: string;
  subject?: string;
  ratePerHour?: number;
  bookingFor?: 'self' | 'children';
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: string | number;
  note?: string | null;
  scheduled_time?: string;
  lesson_id?: string | number;
  teacher_name?: string;
  parent?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  } | null;
  teacher?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  } | null;
  children?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    grade?: string | null;
    school?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
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
