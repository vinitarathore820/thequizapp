const ngrok = require('ngrok');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// Use different ports for server and ngrok
const SERVER_PORT = process.env.SERVER_PORT || 5001;
const NGROK_PORT = process.env.PORT || 5000;

// Ensure we're in development mode
process.env.NODE_ENV = 'development';

// Start the server
// Kill any existing node processes on the server port
const { execSync } = require('child_process');
try {
  if (process.platform === 'win32') {
    execSync(`netstat -ano | findstr :${SERVER_PORT}`, { stdio: 'pipe' });
    execSync(`taskkill /F /IM node.exe`, { stdio: 'pipe' });
  } else {
    execSync(`lsof -ti:${SERVER_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'pipe' });
  }
} catch (e) {
  // No process found, continue
}

// Start the server with clean environment
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: SERVER_PORT,
    NODE_ENV: 'development',
    FORCE_COLOR: '1'  // Force colors in the console
  }
});

// When server starts, start ngrok
server.on('spawn', async () => {
  try {
    console.log('Starting server...');
    
    console.log('Setting up ngrok tunnel...');
    
    const url = await ngrok.connect({
      addr: NGROK_PORT,
      authtoken: process.env.NGROK_AUTH_TOKEN,
      region: 'us',
      onStatusChange: status => {
        if (status === 'connected') {
          console.log('ngrok: Tunnel connected');
        } else if (status === 'closed' || status === 'error') {
          console.error(`ngrok: Tunnel ${status}`);
        }
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('🚀 Server is running!'.padStart(40));
    console.log('='.repeat(60));
    console.log(`🔗 Local URL:   http://localhost:${SERVER_PORT}`.padStart(20));
    console.log(`� Public URL:  ${url}`.padStart(20));
    console.log('='.repeat(60) + '\n');
    
    // Save the URL to a file for other tools to use
    const fs = require('fs');
    fs.writeFileSync('ngrok-url.txt', url);

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down ngrok and server...');
      await ngrok.kill();
      server.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting ngrok:', error);
    server.kill();
    process.exit(1);
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});
