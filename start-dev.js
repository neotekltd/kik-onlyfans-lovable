import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Supabase environment variables
const env = {
  ...process.env,
  VITE_SUPABASE_URL: 'https://igtkrpfpbbcciqyozuqb.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGtycGZwYmJjY2lxeW96dXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyOTcsImV4cCI6MjA2NjI2ODI5N30.Y1dJyTvdRyMCPMwPhXYBfq53Mx-rfm1n7lLQevQgvDs',
  NODE_ENV: 'development'
};

// Start the server
console.log('Starting server...');
const server = spawn('tsx', ['server/index.ts'], { 
  env,
  stdio: 'inherit',
  shell: true
});

// Start the client
console.log('Starting client...');
const client = spawn('vite', ['client', '--port', '5173'], { 
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.kill();
  client.kill();
  process.exit();
});

// Handle child process errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

client.on('error', (error) => {
  console.error('Client error:', error);
});

// Handle child process exit
server.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
  if (code !== 0 && !process.exitCode) {
    process.exit(code);
  }
});

client.on('exit', (code) => {
  console.log(`Client process exited with code ${code}`);
  if (code !== 0 && !process.exitCode) {
    process.exit(code);
  }
});

console.log('Development environment running!');
console.log('- Client: http://localhost:5173');
console.log('- Server: http://localhost:3000');