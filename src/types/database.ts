// ============================================
// MindFlow — Database Types (mirrors Supabase schema)
// ============================================

export type Priority = 'low' | 'medium' | 'high';
export type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
export type ThemeMode = 'light' | 'dark' | 'system';

// ---- User Profile ----
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  theme: ThemeMode;
  created_at: string;
  updated_at: string;
}

// ---- Folder / Notebook ----
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Note ----
export interface Note {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  content: Record<string, unknown>;
  plain_text: string;
  summary: string | null;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ---- Note Tag ----
export interface NoteTag {
  id: string;
  note_id: string;
  tag: string;
}

// ---- Task / Todo ----
export interface Task {
  id: string;
  user_id: string;
  parent_id: string | null;
  note_id: string | null;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  priority: Priority;
  due_date: string | null;
  due_time: string | null;
  sort_order: number;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  tags: string[];
  subtasks: Task[];
  created_at: string;
  updated_at: string;
}

// ---- Task Tag ----
export interface TaskTag {
  id: string;
  task_id: string;
  tag: string;
}

// ---- Reminder ----
export interface Reminder {
  id: string;
  user_id: string;
  note_id: string | null;
  task_id: string | null;
  title: string;
  remind_at: string;
  repeat_type: RepeatType;
  repeat_config: Record<string, unknown> | null;
  is_active: boolean;
  is_sent: boolean;
  created_at: string;
}

// ---- Push Subscription ----
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: Record<string, string>;
  created_at: string;
}
