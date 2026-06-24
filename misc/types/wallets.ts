export type WalletType = 'main' | 'referrals' | 'welfare' | 'fees';
export type WalletDirection = 'credit' | 'debit';

export interface Wallet {
  id: string;
  ownerType: 'user' | 'platform';
  ownerId: string | null;
  walletType: WalletType;
  balance: string;
  currency: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  direction: WalletDirection;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  type: string;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface MyWalletsResponse {
  wallets: Wallet[];
}

export interface WalletTransactionsResponse {
  wallet: Wallet;
  transactions: WalletTransaction[];
}
