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

// Start autonomous agent with direct output
console.log('🤖 Starting Autonomous Agent...\n');
const autonomousAgent = spawn('tsx', ['src/index-autonomous.ts'], {
  stdio: 'inherit',
  env: process.env,
});

// Wait a bit before starting XMTP agent
setTimeout(() => {
  console.log('\n💬 Starting XMTP Agent...\n');
  const xmtpAgent = spawn('tsx', ['src/xmtp-agent.ts'], {
    stdio: 'inherit',
    env: process.env,
  });

  xmtpAgent.on('exit', (code) => {
    console.log(`\n⚠️  XMTP agent exited with code ${code}`);
    if (code !== 0) {
      console.error('❌ XMTP agent failed, process will exit');
      process.exit(1);
    }
  });

  // Handle process termination
  const shutdown = () => {
    console.log('\n🛑 Shutting down agents...');
    autonomousAgent.kill('SIGTERM');
    xmtpAgent.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}, 3000); // Wait 3 seconds between agent starts

autonomousAgent.on('exit', (code) => {
  console.log(`\n⚠️  Autonomous agent exited with code ${code}`);
  if (code !== 0) {
    console.error('❌ Autonomous agent failed, process will exit');
    process.exit(1);
  }
});

console.log('\n✅ Multi-Agent System Starting...');
console.log('📊 Logs from both agents will appear below\n');
