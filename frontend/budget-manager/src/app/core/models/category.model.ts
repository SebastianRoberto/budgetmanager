export interface Category {
  id: number;
  user_id: number;
  name: string;
  monthly_limit: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryRequest {
  name: string;
  monthly_limit?: number | null;
}


