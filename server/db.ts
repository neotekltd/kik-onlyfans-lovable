import { createClient } from '@supabase/supabase-js';
import * as schema from "@shared/schema";

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://igtkrpfpbbcciqyozuqb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs';

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