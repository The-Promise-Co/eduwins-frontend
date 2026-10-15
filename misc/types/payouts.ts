export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'declined' | 'failed';

export interface PayoutAccount {
  teacherId: string;
  bankCode: string;
  bankName?: string | null;
  accountNumber: string;
  accountName: string;
  recipientCode?: string | null;
  lastChangedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayoutAccountChange {
  id: string;
  teacherId: string;
  oldBankCode?: string | null;
  oldBankName?: string | null;
  oldAccountNumber?: string | null;
  oldAccountName?: string | null;
  newBankCode?: string | null;
  newBankName?: string | null;
  newAccountNumber?: string | null;
  newAccountName?: string | null;
  changedAt: string;
  changedBy: string;
}

export interface PayoutRequest {
  id: string;
  teacherId: string;
  amount: string;
  netAmount?: string | null;
  processingFee?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  narration?: string | null;
  status: PayoutStatus;
  declineReason?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  processedAt?: string | null;
}

export interface AvailableBalance {
  availableBalance: number;
  totalEarnings: number;
  reserved: number;
  minWithdrawal: number;
  maxWithdrawal: number;
}

export interface Bank {
  code: string;
  name: string;
}
