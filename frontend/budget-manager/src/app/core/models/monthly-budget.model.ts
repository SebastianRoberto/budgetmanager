export interface MonthlyBudget {
  id: number;
  user_id: number;
  month: number;
  year: number;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyBudgetRequest {
  month: number;
  year: number;
  amount: number;
}

export interface MonthlyBudgetSummary {
  budget: MonthlyBudget | null;
  total_expenses: number | null;
  remaining: number | null;
  percentage_used: number | null;
}


