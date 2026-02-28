#!/usr/bin/env node

// Test script for Claude intent parser

import dotenv from "dotenv";
import { parseIntent } from "./src/intentParserClaude";

dotenv.config();

const testMessages = [
  "necesito copy para landing page, $20",
  "escribe un blog post sobre web3, $25",
  "analiza estos datos CSV, $30 para mañana",
  "traduce 500 palabras a español, $15",
  "investiga sobre IA en blockchain, $40",
];

async function runTests() {
  console.log("\n🧪 Testing Claude API Intent Parser...\n");

  for (const message of testMessages) {
    try {
      console.log(`📝 Message: "${message}"`);
      const intent = await parseIntent(message);
      console.log(`✅ Result:`, JSON.stringify(intent, null, 2));
      console.log("");
    } catch (error: any) {
      console.log(`❌ Error:`, error.message);
      console.log("");
    }
  }

  console.log("✨ Tests completed!\n");
}

runTests().catch(console.error);
