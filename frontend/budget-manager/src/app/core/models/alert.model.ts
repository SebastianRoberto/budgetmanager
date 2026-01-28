export type AlertType =
  | 'budget_exceeded'
  | 'category_exceeded'
  | 'debt_due'
  | 'goal_offtrack';

export interface Alert {
  id: number;
  user_id: number;
  type: AlertType;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}


