export interface SavingGoal {
  id: number;
  user_id: number;
  title: string;
  target_amount: number;
  deadline: string;
  created_at?: string;
  updated_at?: string;
  total_saved?: number;
  progress_percentage?: number;
}

export interface SavingGoalRequest {
  title: string;
  target_amount: number;
  deadline: string;
}

export interface SavingDeposit {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface SavingDepositRequest {
  amount: number;
  date: string;
}


