export interface ProfileCompletion {
  completionPercentage: number;
  nextStep: string;
  isPremium: boolean;
  completion: {
    headshot: boolean;
    videoIntro: boolean;
    credentials: boolean;
    credentialsVerified: boolean;
  };
}
