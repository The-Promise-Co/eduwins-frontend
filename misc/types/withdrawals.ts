export interface BalanceData {
  availableBalance: number;
  totalAcquired: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  processingFee: string;
  estimatedProcessingTime: string;
  deductions: {
    welfareFund: number;
    mortgagePayment: number;
    reserved: number;
  };
}

export interface Bank {
  code: string;
  name: string;
}

export interface Withdrawal {
  withdrawal_id: string;
  amount: number;
  net_amount: number;
  account_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

export interface HistoryStats {
  total_withdrawn: number;
  pending_count: number;
  failed_count: number;
  total_processing_fees: number;
}
