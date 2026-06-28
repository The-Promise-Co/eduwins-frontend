export interface ProfileCompletion {
  completionPercentage: number;
  nextStep: string;
  isPremium: boolean;
  completion: {
    photo?: boolean;
    profile_picture?: boolean;
    bio?: boolean;
    subjects?: boolean;
    video_intro?: boolean;
    schedule?: boolean;
    availability?: boolean;
    hourly_pay?: boolean;
    hourly_rate?: boolean;
    certification?: boolean;
    education?: boolean;
    video_verified: boolean;
    documents_uploaded: boolean;
    documents_verified: boolean;
  };
}
