import { TeacherProfile } from '@/misc/types';

export interface LoginResponse {
  user: TeacherProfile;
  token: string;
  requires2FA?: boolean;
  verificationToken: string;
  requiresVerification?: boolean;
}

export interface RegisterResponse {
  user?: TeacherProfile;
  token?: string;
  verificationToken?: string;
}

export interface VerifyOtpResponse {
  user: TeacherProfile;
  token: string;
}
