export interface ProfileCompletion {
  completionPercentage: number;
  nextStep: string;
  isPremium: boolean;
  completion: {
    photo: boolean;
    video_verified: boolean;
    documents_uploaded: boolean;
    documents_verified: boolean;
  };
}
