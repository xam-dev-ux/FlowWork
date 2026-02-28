// FlowWork Autonomous Agent
// Este agente completa tareas automáticamente

import dotenv from "dotenv";
import { AutonomousAgent } from "./autonomousAgent";

dotenv.config();

console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║     🤖 FlowWork Autonomous Agent 🤖          ║
║                                              ║
║  AI-powered task completion on Base L2      ║
║                                              ║
╚══════════════════════════════════════════════╝
`);

// Verificar configuración
const requiredVars = ["CONTRACT_ADDRESS", "BASE_RPC", "PRIVATE_KEY"];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error(`\nPlease configure them in agent/.env`);
  process.exit(1);
}

// Warnings opcionales
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(`⚠️  ANTHROPIC_API_KEY not set - will use fallback analysis`);
  console.warn(`   For best results, add your Claude API key to .env\n`);
}

if (!process.env.PINATA_API_KEY && !process.env.WEB3_STORAGE_TOKEN) {
  console.warn(`⚠️  No IPFS service configured`);
  console.warn(`   Using content hash fallback instead of real IPFS`);
  console.warn(`   For production, configure PINATA_API_KEY or WEB3_STORAGE_TOKEN\n`);
}

// Mostrar configuración
console.log(`📋 Configuration:`);
console.log(`   Contract: ${process.env.CONTRACT_ADDRESS}`);
console.log(`   Network: Base L2`);
console.log(`   RPC: ${process.env.BASE_RPC}`);
console.log(`   Wallet: ${process.env.PRIVATE_KEY?.slice(0, 10)}...`);
console.log(``);

// Iniciar agente
const agent = new AutonomousAgent();
agent.start().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

// Manejar cierre graceful
process.on("SIGINT", () => {
  console.log("\n\n🛑 Stopping Autonomous Agent...");
  console.log("👋 Goodbye!");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Stopping Autonomous Agent...");
  console.log("👋 Goodbye!");
  process.exit(0);
});
