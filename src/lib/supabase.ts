import { createClient } from '@supabase/supabase-js';
import type { Todo } from '../features/todo/types';

// Access env vars using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Todo }; // Re-export for convenience if needed, though we imported it locally
