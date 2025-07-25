// Enhanced development server with Vite integration
import express from 'express';
import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hardcoded Supabase credentials
const supabaseUrl = 'https://igtkrpfpbbcciqyozuqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  // Create Express app
  const app = express();
  app.use(express.json());
  
  const server = createServer(app);

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: { server }
    },
    appType: 'spa'
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
  });

  app.get('/api/posts', async (req, res) => {
    try {
      // Simulate posts data
      const posts = [
        { id: 1, title: 'Welcome to Fanixora', content: 'This is a sample post' },
        { id: 2, title: 'Getting Started', content: 'Learn how to use the platform' }
      ];
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Serve index.html for all other routes
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Read index.html
      let template = fs.readFileSync(path.resolve(__dirname, 'client/index.html'), 'utf-8');
      
      // Apply Vite HTML transforms
      template = await vite.transformIndexHtml(url, template);
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  // Start server
  const port = 8080;
  server.listen(port, '0.0.0.0', () => {
    console.log(`Development server running on http://localhost:${port}`);
  });
}

startServer().catch((e) => {
  console.error('Error starting server:', e);
});