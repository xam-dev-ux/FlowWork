/**
 * Start both autonomous agent and XMTP chat agent in a single process
 * Use this when deploying to Railway as a single service
 */

import { spawn } from 'child_process';

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║                                              ║');
console.log('║     🚀 FlowWork Multi-Agent System 🚀       ║');
console.log('║                                              ║');
console.log('║  Running Autonomous + XMTP Agents           ║');
console.log('║                                              ║');
console.log('╚══════════════════════════════════════════════╝\n');

// Start autonomous agent
console.log('🤖 Starting Autonomous Agent...');
const autonomousAgent = spawn('tsx', ['src/index-autonomous.ts'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
});

// Prefix autonomous agent logs
autonomousAgent.stdout?.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line: string) => {
    if (line.trim()) {
      console.log(`[AUTONOMOUS] ${line}`);
    }
  });
});

autonomousAgent.stderr?.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line: string) => {
    if (line.trim()) {
      console.error(`[AUTONOMOUS] ${line}`);
    }
  });
});

// Wait a bit before starting XMTP agent
setTimeout(() => {
  console.log('\n💬 Starting XMTP Agent...');
  const xmtpAgent = spawn('tsx', ['src/xmtp-agent.ts'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  // Prefix XMTP agent logs
  xmtpAgent.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        console.log(`[XMTP] ${line}`);
      }
    });
  });

  xmtpAgent.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) {
        console.error(`[XMTP] ${line}`);
      }
    });
  });

  xmtpAgent.on('exit', (code) => {
    console.log(`\n⚠️  XMTP agent exited with code ${code}`);
    if (code !== 0) {
      console.log('🔄 Restarting XMTP agent...');
      // Railway will handle the restart
    }
  });

  // Handle process termination
  const shutdown = () => {
    console.log('\n🛑 Shutting down agents...');
    autonomousAgent.kill();
    xmtpAgent.kill();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}, 2000); // Wait 2 seconds between agent starts

autonomousAgent.on('exit', (code) => {
  console.log(`\n⚠️  Autonomous agent exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Process will restart...');
  }
});

console.log('\n✅ Multi-Agent System Started');
console.log('📊 View logs above for each agent\n');
