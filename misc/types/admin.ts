export interface AdminOverview {
  totalUsers: number;
  totalTeachers: number;
  totalParents: number;
  pendingRentApplications: number;
  totalVaultItems: number;
}

export interface WelfareAnalytics {
  totalAccumulated: number;
  totalAvailable: number;
  totalLocked: number;
}

export interface Dispute {
  id: string;
  booking_id: string;
  status: string;
  issue: string;
  created_by: string;
}

export interface AdminStatsData {
  totalTeachers: number;
  totalParents: number;
  totalEarnings: number;
  welfarePooled: number;
}

export interface AdminBooking {
  id: string;
  parentName: string;
  teacherName: string;
  totalCost: number;
  totalSessions: number;
  status: string;
}

export type PlatformConfigTarget = 'tutor' | 'welfare' | 'platform_fee';
export type PlatformConfigValueType = 'flat_fee' | 'percentage';

export interface PlatformConfig {
  id: string;
  key: string;
  label: string;
  target: PlatformConfigTarget;
  valueType: PlatformConfigValueType;
  value: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfigInput {
  key: string;
  label: string;
  target: PlatformConfigTarget;
  valueType: PlatformConfigValueType;
  value: string | number;
  description?: string;
  isActive?: boolean;
}
