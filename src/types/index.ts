export type Role = 'teacher' | 'parent' | 'admin' | 'ambassador';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  token?: string;
  phoneNumber?: string;
  location?: string;
  avatarUrl?: string;
}

export interface TeacherProfile extends User {
  subjects: string[];
  bio: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  verified: boolean;
  introVideoUrl?: string;
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
  score: number;
  comments: string;
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
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  createdAt: string;
}
