// Simple development server that doesn't rely on environment variables
import express from 'express';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials
const supabaseUrl = 'https://igtkrpfpbbcciqyozuqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Express app
const app = express();
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.send('Development server is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Serve static files from client directory
app.use(express.static('client'));

// Start server
const port = 3000;
const server = createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`Development server running on http://localhost:${port}`);
});