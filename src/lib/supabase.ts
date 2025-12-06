import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Student {
  id: string;
  name: string;
  email: string;
  goal: string;
  level: string;
  weight: number;
  height: number;
  age: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingVideo {
  id: string;
  title: string;
  student_id: string;
  url: string;
  upload_date: string;
  type: 'specific' | 'live';
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  student_id: string;
  workout_day: string;
  completed_at: string;
  duration_minutes: number;
  notes?: string;
}

export interface ProgressEntry {
  id: string;
  student_id: string;
  weight: number;
  date: string;
  notes?: string;
}
