import { Agent } from "@xmtp/agent-sdk";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import dotenv from "dotenv";
// OPCIÓN 1: OpenAI (de pago)
// import { parseIntent } from "./intentParser";

// OPCIÓN 2: Ollama Local (GRATIS) ✅ ACTIVADO
import { parseIntent } from "./intentParserLocal";
import { ContractClient } from "./contractClient";
import { X402Client } from "./x402Client";

dotenv.config();

const ONBOARDING_MESSAGE = `hey, i'm flowwork ⚡ the autonomous work marketplace.

post any task, AI agents compete to do it.
you pay only when you approve the result.

try: 'write product copy for my app, $15'
or: 'analyze this CSV and give me insights, $25'
or: 'translate 500 words to Spanish, $10'

what do you need done?`;

class FlowWorkAgent {
  private agent: Agent;
  private contractClient: ContractClient;
  private x402Client: X402Client;
  private seenMessages: Set<string> = new Set();
  private firstTimeUsers: Set<string> = new Set();

  constructor() {
    if (!process.env.XMTP_WALLET_KEY) {
      throw new Error("XMTP_WALLET_KEY not set");
    }
    if (!process.env.CONTRACT_ADDRESS) {
      throw new Error("CONTRACT_ADDRESS not set");
    }

    this.contractClient = new ContractClient(
      process.env.CONTRACT_ADDRESS,
      process.env.BASE_RPC || "https://mainnet.base.org",
      process.env.XMTP_WALLET_KEY
    );

    this.x402Client = new X402Client(process.env.XMTP_WALLET_KEY);

    const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);

    this.agent = new Agent({
      privateKey: process.env.XMTP_WALLET_KEY,
      encryptionKey: process.env.XMTP_DB_ENCRYPTION_KEY || "",
      env: (process.env.XMTP_ENV as "production" | "dev") || "production",
      wallet: createWalletClient({
        account,
        chain: base,
        transport: http(process.env.BASE_RPC || "https://mainnet.base.org"),
      }),
    });

    console.log("FlowWork Agent initialized");
    console.log("Agent address:", account.address);
  }

  async start() {
    console.log("Starting FlowWork agent...");

    await this.agent.start();

    this.agent.onMessage(async (message, conversation) => {
      try {
        if (this.seenMessages.has(message.id)) return;
        this.seenMessages.add(message.id);

        if (message.senderAddress === this.agent.address) return;

        console.log(`Message from ${message.senderAddress}: ${message.content}`);

        await conversation.send({ reaction: "⌛", reference: message.id });

        if (!this.firstTimeUsers.has(message.senderAddress)) {
          this.firstTimeUsers.add(message.senderAddress);
          await conversation.send(ONBOARDING_MESSAGE);
          return;
        }

        const intent = await parseIntent(message.content);

        if (!intent) {
          await conversation.send(
            "i couldn't understand that. try something like:\n'write landing page copy, $20' or 'analyze this data, $30'"
          );
          return;
        }

        switch (intent.action) {
          case "create_task":
            await this.handleCreateTask(intent, conversation, message.senderAddress);
            break;

          case "bid_on_task":
            await this.handleBidOnTask(intent, conversation, message.senderAddress);
            break;

          case "approve_delivery":
            await this.handleApproveDelivery(intent, conversation);
            break;

          case "open_dispute":
            await this.handleOpenDispute(intent, conversation);
            break;

          default:
            await conversation.send(
              "not sure what to do. need help? visit https://flowwork.vercel.app"
            );
        }
      } catch (error) {
        console.error("Error handling message:", error);
        await conversation.send(
          "something went wrong. please try again or check https://flowwork.vercel.app"
        );
      }
    });

    this.listenToContractEvents();

    console.log("FlowWork agent is running!");
  }

  private async handleCreateTask(intent: any, conversation: any, clientAddress: string) {
    try {
      await conversation.send("creating your task on-chain...");

      const taskId = await this.contractClient.createTask(
        clientAddress,
        intent.description,
        intent.deliveryFormat || "Any format",
        intent.category,
        intent.deadline,
        intent.bounty
      );

      await conversation.send(
        `✅ task created! id: ${taskId}\n\nwaiting for agent bids. you'll get notified when agents respond.\n\nview details: https://flowwork.vercel.app/tasks/${taskId}`
      );

      setTimeout(() => this.notifyMatchingAgents(taskId, intent.category), 5000);
    } catch (error: any) {
      console.error("Create task error:", error);
      await conversation.send(`failed to create task: ${error.message}`);
    }
  }

  private async handleBidOnTask(intent: any, conversation: any, agentAddress: string) {
    try {
      await conversation.send("submitting your bid...");

      await this.contractClient.submitBid(
        agentAddress,
        intent.taskId,
        intent.price,
        intent.proposal,
        intent.estimatedTime || 3600
      );

      await conversation.send(
        `✅ bid submitted!\n\ntask: ${intent.taskId}\nprice: $${intent.price / 1_000_000}\n\nthe client will review and may select you.`
      );

      const task = await this.contractClient.getTask(intent.taskId);
      await this.notifyClient(
        task.client,
        `new bid on task #${intent.taskId} from ${agentAddress.slice(0, 8)}...\nprice: $${intent.price / 1_000_000}`
      );
    } catch (error: any) {
      console.error("Bid error:", error);
      await conversation.send(`failed to submit bid: ${error.message}`);
    }
  }

  private async handleApproveDelivery(intent: any, conversation: any) {
    try {
      await conversation.send("approving delivery and releasing payment...");

      await this.contractClient.approveDelivery(intent.taskId);

      await conversation.send(
        `✅ delivery approved! payment released to agent.\n\nthanks for using flowwork!`
      );
    } catch (error: any) {
      console.error("Approval error:", error);
      await conversation.send(`failed to approve: ${error.message}`);
    }
  }

  private async handleOpenDispute(intent: any, conversation: any) {
    try {
      await conversation.send("opening dispute...");

      await this.contractClient.openDispute(intent.taskId, intent.reason);

      await conversation.send(
        `⚠️ dispute opened.\n\n3 reviewers have been selected. they'll vote within 24h.\n\nreason: ${intent.reason}`
      );
    } catch (error: any) {
      console.error("Dispute error:", error);
      await conversation.send(`failed to open dispute: ${error.message}`);
    }
  }

  private async listenToContractEvents() {
    console.log("Listening to contract events...");

    this.contractClient.onTaskCreated(async (event: any) => {
      console.log("TaskCreated event:", event);
    });

    this.contractClient.onAgentAssigned(async (event: any) => {
      console.log("AgentAssigned event:", event);

      const agentAddress = event.args.agent;
      const taskId = event.args.taskId;

      await this.notifyAgent(
        agentAddress,
        `🎉 you've been selected for task #${taskId}!\n\nstart working and submit delivery when ready.\n\nview: https://flowwork.vercel.app/tasks/${taskId}`
      );
    });

    this.contractClient.onTaskDelivered(async (event: any) => {
      console.log("TaskDelivered event:", event);

      const task = await this.contractClient.getTask(event.args.taskId);

      await this.notifyClient(
        task.client,
        `📦 task #${event.args.taskId} delivered!\n\nipfs: ${event.args.ipfsHash}\n\nreview and approve or dispute.\n\nview: https://flowwork.vercel.app/tasks/${event.args.taskId}`
      );
    });

    this.contractClient.onTaskApproved(async (event: any) => {
      console.log("TaskApproved event:", event);

      await this.notifyAgent(
        event.args.agent,
        `💰 payment received for task #${event.args.taskId}!\n\namount: $${Number(event.args.amount) / 1_000_000}\n\nwithdraw anytime at https://flowwork.vercel.app/profile`
      );
    });

    this.contractClient.onDisputeOpened(async (event: any) => {
      console.log("DisputeOpened event:", event);

      const reviewers = event.args.reviewers;
      for (const reviewer of reviewers) {
        await this.notifyAgent(
          reviewer,
          `⚖️ you've been selected as a dispute reviewer for task #${event.args.taskId}\n\nreview the work and vote within 24h.\n\nview: https://flowwork.vercel.app/tasks/${event.args.taskId}`
        );
      }
    });
  }

  private async notifyMatchingAgents(taskId: number, category: number) {
    const agents = await this.contractClient.getAllAgents();

    for (const agentAddress of agents) {
      const agent = await this.contractClient.getAgent(agentAddress);

      if (agent.specialties.includes(this.categoryToString(category))) {
        await this.notifyAgent(
          agentAddress,
          `🔔 new task in ${this.categoryToString(category)}!\n\ntask #${taskId}\n\nsubmit a bid to compete.\n\nview: https://flowwork.vercel.app/tasks/${taskId}`
        );
      }
    }
  }

  private async notifyAgent(address: string, message: string) {
    try {
      const conversation = await this.agent.getConversation(address);
      if (conversation) {
        await conversation.send(message);
      }
    } catch (error) {
      console.error(`Failed to notify agent ${address}:`, error);
    }
  }

  private async notifyClient(address: string, message: string) {
    try {
      const conversation = await this.agent.getConversation(address);
      if (conversation) {
        await conversation.send(message);
      }
    } catch (error) {
      console.error(`Failed to notify client ${address}:`, error);
    }
  }

  private categoryToString(category: number): string {
    const categories = [
      "Copywriting",
      "CodeReview",
      "DataAnalysis",
      "ImagePrompts",
      "Research",
      "Translation",
      "SocialMedia",
      "Financial",
      "Legal",
      "Other",
    ];
    return categories[category] || "Other";
  }
}

const agent = new FlowWorkAgent();
agent.start().catch(console.error);

process.on("SIGINT", () => {
  console.log("\nShutting down FlowWork agent...");
  process.exit(0);
});
