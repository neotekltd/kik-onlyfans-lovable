// Set environment variables
process.env.VITE_SUPABASE_URL = 'https://igtkrpfpbbcciqyozuqb.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs';
process.env.NODE_ENV = 'development';

// Import and run the server
import('./server/index.js').catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});