/**
 * Simple test script to verify Railway deployment works
 */

console.log('╔══════════════════════════════════════════════╗');
console.log('║                                              ║');
console.log('║           🧪 DEPLOYMENT TEST 🧪              ║');
console.log('║                                              ║');
console.log('╚══════════════════════════════════════════════╝\n');

console.log('✅ Script is running!');
console.log(`📦 Node version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`📁 Working directory: ${process.cwd()}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

// Test environment variables
console.log('🔐 Checking environment variables...');
const requiredVars = [
  'XMTP_WALLET_KEY',
  'XMTP_DB_ENCRYPTION_KEY',
  'XMTP_ENV',
  'CONTRACT_ADDRESS',
  'BASE_RPC',
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const display = varName.includes('KEY') || varName.includes('PRIVATE')
      ? `${value.substring(0, 10)}...`
      : value;
    console.log(`  ✅ ${varName}: ${display}`);
  } else {
    console.log(`  ❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔄 Testing XMTP SDK import...');
try {
  require('@xmtp/agent-sdk');
  console.log('  ✅ @xmtp/agent-sdk imported successfully');
} catch (error: any) {
  console.log(`  ❌ Failed to import @xmtp/agent-sdk: ${error.message}`);
}

console.log('\n🔄 Testing ethers import...');
try {
  require('ethers');
  console.log('  ✅ ethers imported successfully');
} catch (error: any) {
  console.log(`  ❌ Failed to import ethers: ${error.message}`);
}

console.log('\n💤 Keeping process alive for 60 seconds...');
console.log('(Railway should show these logs)\n');

// Keep alive for 60 seconds
let counter = 0;
const interval = setInterval(() => {
  counter++;
  console.log(`⏱️  Still running... ${counter}s`);

  if (counter >= 60) {
    console.log('\n✅ Test completed successfully!');
    console.log('🎉 Deployment is working!\n');
    clearInterval(interval);
    process.exit(0);
  }
}, 1000);

// Handle termination
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  clearInterval(interval);
  process.exit(0);
});
