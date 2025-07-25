import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL must be set. Did you forget to configure Supabase?",
  );
}

// In development, we can use the anon key if the service key isn't available
let supabaseKey = supabaseServiceKey;
if (!supabaseKey && process.env.NODE_ENV === 'development') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, falling back to VITE_SUPABASE_ANON_KEY for development');
  supabaseKey = supabaseAnonKey;
}

if (!supabaseKey) {
  throw new Error(
    "Either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY must be set for development.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// For compatibility with existing code that expects a db export
export const db = supabase;