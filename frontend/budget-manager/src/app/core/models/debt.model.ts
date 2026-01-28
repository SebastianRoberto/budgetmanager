export type DebtType = 'outgoing' | 'incoming';
export type DebtStatus = 'pending' | 'paid' | 'late';

export interface Debt {
  id: number;
  user_id: number;
  type: DebtType;
  person: string;
  amount: number;
  due_date: string;
  status: DebtStatus;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DebtRequest {
  type: DebtType;
  person: string;
  amount: number;
  due_date: string;
  status?: DebtStatus;
  description?: string | null;
}


