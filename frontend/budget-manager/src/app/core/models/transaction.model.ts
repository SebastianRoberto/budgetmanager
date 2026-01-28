export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  category_id: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
  amount: number;
  description: string | null;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionRequest {
  type: TransactionType;
  category_id?: number | null;
  amount: number;
  description?: string | null;
  date: string;
}


