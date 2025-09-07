import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'student' | 'faculty' | 'admin';
  subjects?: string[];
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  subject: string;
  department: string;
  uploaded_by: string;
  description?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
  uploader?: Profile;
}

export interface Enrollment {
  id: string;
  student_id: string;
  subject: string;
  department: string;
  enrolled_at: string;
}
