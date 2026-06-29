import type { ProfileCompletion } from '@/misc/types/uploads';

export const PROFILE_COMPLETION_STEPS = [
  { key: 'photo', label: 'Profile picture', href: '/app/profile' },
  { key: 'bio', label: 'Bio', href: '/app/profile' },
  { key: 'subjects', label: 'Subjects', href: '/app/profile/teaching' },
  { key: 'video_intro', label: 'Video intro', href: '/app/profile/video' },
  { key: 'schedule', label: 'Availability schedule', href: '/app/profile/teaching' },
  { key: 'hourly_pay', label: 'Hourly pay', href: '/app/profile/teaching' },
  { key: 'certification', label: 'Certification', href: '/app/profile/certifications' },
  { key: 'education', label: 'Education', href: '/app/profile/education' },
] as const;

export function getNextProfileStep(completion?: ProfileCompletion | null) {
  const data = completion?.completion;
  if (!data) return PROFILE_COMPLETION_STEPS[0];
  return PROFILE_COMPLETION_STEPS.find((step) => !Boolean((data as any)[step.key])) || null;
}

export function getProfileCompletionHref(completion?: ProfileCompletion | null) {
  return getNextProfileStep(completion)?.href || '/app/profile';
}
