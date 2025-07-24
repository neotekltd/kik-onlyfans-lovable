import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL must be set. Did you forget to configure Supabase?",
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY must be set. Did you forget to configure Supabase?",
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// For compatibility with existing code that expects a db export
export const db = supabase;