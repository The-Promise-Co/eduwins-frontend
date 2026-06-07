export interface SubscriptionStatus {
  subscriptionActive: boolean;
  currentPlan: string | null;
  daysRemaining: number | null;
}
