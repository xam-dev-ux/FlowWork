// Versión simplificada del agente FlowWork (sin XMTP SDK)
// Para usar XMTP real, instalar: npm install @xmtp/agent-sdk

import dotenv from "dotenv";
import { parseIntent } from "./intentParserClaude";
import { ContractClient } from "./contractClient";

dotenv.config();

class FlowWorkAgent {
  private contractClient: ContractClient;

  constructor() {
    if (!process.env.CONTRACT_ADDRESS) {
      throw new Error("CONTRACT_ADDRESS not set");
    }

    const privateKey = process.env.PRIVATE_KEY || process.env.XMTP_WALLET_KEY;
    if (!privateKey) {
      throw new Error("PRIVATE_KEY not set in .env");
    }

    this.contractClient = new ContractClient(
      process.env.CONTRACT_ADDRESS,
      process.env.BASE_RPC || "https://mainnet.base.org",
      privateKey
    );

    console.log("FlowWork Agent initialized");
    console.log("Monitoring contract:", process.env.CONTRACT_ADDRESS);
  }

  async start() {
    console.log("Starting FlowWork contract monitor...\n");

    this.listenToContractEvents();

    console.log("✅ Agent is running!");
    console.log("📡 Listening for contract events on Base L2");
    console.log("\nℹ️  Para XMTP chat completo, instalar @xmtp/agent-sdk\n");
  }

  private async listenToContractEvents() {
    console.log("🔍 Watching for events...\n");

    this.contractClient.onTaskCreated(async (taskId: any, client: any, category: any, bounty: any, deadline: any, description: any) => {
      console.log("🆕 TaskCreated:");
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Client: ${client}`);
      console.log(`   Category: ${category}`);
      console.log(`   Bounty: $${Number(bounty) / 1_000_000}`);
      console.log(`   Description: ${description}\n`);
    });

    this.contractClient.onAgentAssigned(async (taskId: any, agent: any, price: any) => {
      console.log("👤 AgentAssigned:");
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Agent: ${agent}`);
      console.log(`   Price: $${Number(price) / 1_000_000}\n`);
    });

    this.contractClient.onTaskDelivered(async (taskId: any, agent: any, ipfsHash: any) => {
      console.log("📦 TaskDelivered:");
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Agent: ${agent}`);
      console.log(`   IPFS: ${ipfsHash}\n`);
    });

    this.contractClient.onTaskApproved(async (taskId: any, client: any, agent: any, amount: any, protocolFee: any, reviewerFee: any) => {
      console.log("✅ TaskApproved:");
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Agent: ${agent}`);
      console.log(`   Payment: $${Number(amount) / 1_000_000}\n`);
    });

    this.contractClient.onDisputeOpened(async (taskId: any, initiator: any, reason: any, reviewers: any) => {
      console.log("⚠️  DisputeOpened:");
      console.log(`   Task ID: ${taskId}`);
      console.log(`   Initiator: ${initiator}`);
      console.log(`   Reviewers: ${reviewers.length}\n`);
    });
  }
}

// Iniciar agente
const agent = new FlowWorkAgent();
agent.start().catch(console.error);

// Mantener proceso corriendo
process.on("SIGINT", () => {
  console.log("\n\n🛑 Stopping FlowWork agent...");
  process.exit(0);
});
