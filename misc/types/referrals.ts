export interface ReferralReferee {
  id: string;
  name: string;
  role: string;
  email: string;
  joinedAt?: string | null;
}

export interface ReferralSubscription {
  plan: string;
  planLabel: string;
  rewardAmount: number;
}

export interface ReferralItem {
  id: string;
  referrerId: string;
  refereeId: string;
  subscriptionPlan?: string | null;
  rewardAmount?: string | null;
  createdAt?: string | null;
  rewardedAt?: string | null;
  referee: ReferralReferee | null;
  status: 'pending' | 'subscribed';
  rewardCredited: boolean;
  subscription: ReferralSubscription | null;
  pendingRewardEstimates: Record<string, { price: number; reward: number }> | null;
}

export interface ReferralSummary {
  total: number;
  pending: number;
  subscribed: number;
  totalRewardCredited: number;
  pendingRewardEstimate: number;
}

export interface MyReferralsResponse {
  referrals: ReferralItem[];
  summary: ReferralSummary;
}
