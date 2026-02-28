// Agente Autónomo - Completa tareas automáticamente

import dotenv from "dotenv";
import { ContractClient } from "./contractClient";
import { canExecuteTask, executeTask } from "./taskExecutor";
import { uploadToIPFS } from "./ipfsClient";
import { ethers } from "ethers";

dotenv.config();

interface Task {
  id: number;
  description: string;
  deliveryFormat: string;
  category: number;
  bounty: bigint;
  deadline: number;
  client: string;
}

interface AgentConfig {
  minBounty: number; // Mínimo bounty en USDC para aceptar
  maxBounty: number; // Máximo bounty (control de riesgo)
  minConfidence: number; // Confianza mínima (0-100) para aceptar
  autoBid: boolean; // Si debe hacer bids automáticamente
  autoExecute: boolean; // Si debe ejecutar tareas automáticamente
  categories: number[]; // Categorías que acepta (vacío = todas)
}

export class AutonomousAgent {
  private contractClient: ContractClient;
  private config: AgentConfig;
  private activeTasks: Map<number, Task> = new Map();
  private assignedTasks: Map<number, Task> = new Map();

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

    // Configuración del agente
    this.config = {
      minBounty: parseFloat(process.env.MIN_BOUNTY || "0.01"), // $0.01 mínimo
      maxBounty: parseFloat(process.env.MAX_BOUNTY || "100"), // $100 máximo
      minConfidence: parseInt(process.env.MIN_CONFIDENCE || "60"), // 60% confianza
      autoBid: process.env.AUTO_BID !== "false", // Activado por defecto
      autoExecute: process.env.AUTO_EXECUTE !== "false", // Activado por defecto
      categories: process.env.ALLOWED_CATEGORIES
        ? process.env.ALLOWED_CATEGORIES.split(",").map((c) => parseInt(c))
        : [], // Todas por defecto
    };

    console.log("🤖 Autonomous Agent initialized");
    console.log("⚙️  Configuration:");
    console.log(`   Min bounty: $${this.config.minBounty}`);
    console.log(`   Max bounty: $${this.config.maxBounty}`);
    console.log(`   Min confidence: ${this.config.minConfidence}%`);
    console.log(`   Auto bid: ${this.config.autoBid}`);
    console.log(`   Auto execute: ${this.config.autoExecute}`);
    console.log(`   Categories: ${this.config.categories.length ? this.config.categories : "ALL"}`);
  }

  async start() {
    console.log("\n🚀 Starting Autonomous Agent...\n");

    // Escuchar eventos del contrato
    this.contractClient.onTaskCreated(async (taskId, client, category, bounty, deadline, description, isRecurring, recurringInterval, event) => {
      await this.handleTaskCreated(taskId, client, category, bounty, deadline, description);
    });

    this.contractClient.onAgentAssigned(async (taskId, agent, price, event) => {
      await this.handleAgentAssigned(taskId, agent, price);
    });

    this.contractClient.onTaskApproved(async (taskId, client, agent, amount, protocolFee, reviewerFee, event) => {
      await this.handleTaskApproved(taskId, agent, amount);
    });

    console.log("✅ Autonomous Agent running!");
    console.log("🎯 Waiting for tasks...\n");
  }

  private async handleTaskCreated(
    taskId: any,
    client: any,
    category: any,
    bounty: any,
    deadline: any,
    description: any
  ) {
    taskId = Number(taskId);
    category = Number(category);
    deadline = Number(deadline);

    console.log("\n🆕 New Task Detected!");
    console.log(`   Task ID: ${taskId}`);
    console.log(`   Client: ${client}`);
    console.log(`   Category: ${this.getCategoryName(category)}`);
    console.log(`   Bounty: $${ethers.formatUnits(bounty, 6)}`);
    console.log(`   Description: "${description}"`);

    // Guardar tarea
    const task: Task = {
      id: taskId,
      description,
      deliveryFormat: "Any format",
      category,
      bounty,
      deadline: Number(event.args.deadline),
      client,
    };

    this.activeTasks.set(taskId, task);

    // Analizar si podemos hacer la tarea
    if (this.config.autoBid) {
      await this.analyzeAndBid(task);
    } else {
      console.log("   ⏸️  Auto-bid disabled. Skipping.");
    }
  }

  private async analyzeAndBid(task: Task) {
    try {
      // 1. Validar bounty
      const bountyUSDC = parseFloat(ethers.formatUnits(task.bounty, 6));
      if (bountyUSDC < this.config.minBounty) {
        console.log(`   ❌ Bounty too low ($${bountyUSDC} < $${this.config.minBounty})`);
        return;
      }
      if (bountyUSDC > this.config.maxBounty) {
        console.log(`   ❌ Bounty too high ($${bountyUSDC} > $${this.config.maxBounty})`);
        return;
      }

      // 2. Validar categoría
      if (
        this.config.categories.length > 0 &&
        !this.config.categories.includes(task.category)
      ) {
        console.log(`   ❌ Category not allowed (${this.getCategoryName(task.category)})`);
        return;
      }

      // 3. Analizar si podemos ejecutarla
      console.log(`   🔍 Analyzing task...`);
      const analysis = await canExecuteTask(task.description, task.category);

      console.log(`   📊 Analysis result:`);
      console.log(`      Can execute: ${analysis.canExecute}`);
      console.log(`      Confidence: ${analysis.confidence}%`);
      console.log(`      Est. time: ${Math.round(analysis.estimatedTime / 60)} min`);

      if (!analysis.canExecute) {
        console.log(`   ❌ Cannot execute this task`);
        return;
      }

      if (analysis.confidence < this.config.minConfidence) {
        console.log(
          `   ❌ Confidence too low (${analysis.confidence}% < ${this.config.minConfidence}%)`
        );
        return;
      }

      // 4. Hacer bid (pedimos el 95% del bounty)
      const bidPrice = (task.bounty * BigInt(95)) / BigInt(100);
      const proposal = `I can complete this task with ${analysis.confidence}% confidence. Estimated time: ${Math.round(analysis.estimatedTime / 60)} minutes.`;

      console.log(`   💰 Bidding $${ethers.formatUnits(bidPrice, 6)}...`);
      console.log(`   📝 Proposal: "${proposal}"`);

      const tx = await this.contractClient.bidOnTask(
        task.id,
        bidPrice,
        proposal,
        analysis.estimatedTime
      );

      await tx.wait();
      console.log(`   ✅ Bid placed successfully!`);
    } catch (error: any) {
      console.error(`   ❌ Error analyzing/bidding:`, error.message);
    }
  }

  private async handleAgentAssigned(taskId: any, agent: any, price: any) {
    taskId = Number(taskId);
    const myAddress = await this.contractClient.getAddress();

    // Solo procesar si nos asignaron a nosotros
    if (agent.toLowerCase() !== myAddress.toLowerCase()) {
      return;
    }

    console.log(`\n👤 Assigned to task ${taskId}!`);

    const task = this.activeTasks.get(taskId);
    if (!task) {
      console.log(`   ❌ Task not found in active tasks`);
      return;
    }

    this.assignedTasks.set(taskId, task);
    this.activeTasks.delete(taskId);

    if (this.config.autoExecute) {
      // Esperar un poco antes de ejecutar (simular tiempo de trabajo)
      console.log(`   ⏳ Starting task execution...`);
      setTimeout(() => this.executeAndDeliver(task), 5000);
    } else {
      console.log(`   ⏸️  Auto-execute disabled. Task assigned but not executing.`);
    }
  }

  private async executeAndDeliver(task: Task) {
    try {
      console.log(`\n🎯 Executing Task ${task.id}...`);
      console.log(`   Description: "${task.description}"`);

      // 1. Ejecutar la tarea usando Claude
      console.log(`   🤖 Using Claude AI to complete task...`);
      const result = await executeTask(
        task.description,
        task.deliveryFormat,
        task.category
      );

      console.log(`   ✅ Task completed!`);
      console.log(`   📄 Result preview: ${result.slice(0, 100)}...`);

      // 2. Subir a IPFS
      console.log(`   📤 Uploading to IPFS...`);
      const ipfsHash = await uploadToIPFS(result, `task-${task.id}-delivery.txt`);
      console.log(`   ✅ Uploaded to IPFS: ${ipfsHash}`);

      // 3. Entregar al contrato
      console.log(`   📦 Delivering to contract...`);
      const tx = await this.contractClient.deliverTask(task.id, ipfsHash);
      await tx.wait();

      console.log(`   ✅ Task delivered successfully!`);
      console.log(`   🎉 Waiting for client approval...\n`);
    } catch (error: any) {
      console.error(`   ❌ Error executing task:`, error.message);
    }
  }

  private async handleTaskApproved(taskId: any, agent: any, amount: any) {
    taskId = Number(taskId);
    const myAddress = await this.contractClient.getAddress();

    if (agent.toLowerCase() !== myAddress.toLowerCase()) {
      return;
    }

    console.log(`\n🎉 Task ${taskId} approved!`);
    console.log(`   💰 Payment received: $${ethers.formatUnits(amount, 6)} USDC`);
    console.log(`   ✨ Task completed successfully!\n`);

    this.assignedTasks.delete(taskId);
  }

  private getCategoryName(category: number): string {
    const names = [
      "Copywriting",
      "Code Review",
      "Data Analysis",
      "Image Prompts",
      "Research",
      "Translation",
      "Social Media",
      "Financial",
      "Legal",
      "Other",
    ];
    return names[category] || "Unknown";
  }
}
