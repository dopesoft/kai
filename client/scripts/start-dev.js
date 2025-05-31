#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import process from 'process';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPortInUse(port) {
  try {
    // Cross-platform command to check if port is in use
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -ti:${port}`;
    }
    
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim().split('\n').filter(line => line.trim());
  } catch (error) {
    // If command fails, port is likely free
    return [];
  }
}

function killProcessesOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows: Get PID from netstat and kill
      const netstatResult = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: 'pipe' });
      const lines = netstatResult.trim().split('\n');
      const pids = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1];
      }).filter(pid => pid && !isNaN(pid));
      
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
        } catch (e) {
          // Ignore errors when killing processes
        }
      });
    } else {
      // Unix-like systems (Mac, Linux)
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'pipe' });
    }
    return true;
  } catch (error) {
    return false;
  }
}

function startDevServer() {
  const PORT = 8000;
  
  log('🚀 Starting development server...', colors.yellow);
  
  // Check if port is in use
  const processesUsingPort = checkPortInUse(PORT);
  
  if (processesUsingPort.length > 0) {
    log(`⚠️  Port ${PORT} is in use by ${processesUsingPort.length} process(es)`, colors.yellow);
    log('🔧 Killing existing processes...', colors.yellow);
    
    const success = killProcessesOnPort(PORT);
    
    if (!success) {
      log(`❌ Failed to free port ${PORT}. Please manually kill the processes.`, colors.red);
      process.exit(1);
    }
    
    // Wait a moment for processes to die
    setTimeout(() => {
      const stillInUse = checkPortInUse(PORT);
      if (stillInUse.length > 0) {
        log(`❌ Port ${PORT} is still in use. Please manually kill the remaining processes.`, colors.red);
        process.exit(1);
      } else {
        log(`✅ Port ${PORT} is now free`, colors.green);
        startServer();
      }
    }, 1000);
  } else {
    log(`✅ Port ${PORT} is available`, colors.green);
    startServer();
  }
}

function startServer() {
  log('🚀 Starting development server on port 8000...', colors.green);
  
  // Start the development server using npx to find tsx
  const child = spawn('npx', ['tsx', 'server/index.ts'], {
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: 'inherit'
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down development server...', colors.yellow);
    child.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit(0);
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
}

// Start the process
startDevServer(); 