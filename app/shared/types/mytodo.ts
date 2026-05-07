export interface TodoCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  time_sensitive: boolean;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
