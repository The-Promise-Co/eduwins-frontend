export interface Contribution {
  date: string;
  lesson: string;
  total: number;
  status?: 'Available' | 'Locked';
}

export interface WelfareFund {
  teacherId: string;
  total_accumulated: number;
  available_balance: number;
  locked_balance: number;
  contributions: Contribution[];
}
