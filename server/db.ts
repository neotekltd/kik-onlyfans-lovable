import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL must be set. Did you forget to configure Supabase?",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY must be set. Did you forget to configure Supabase?",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For compatibility with existing code that expects a db export
export const db = supabase;