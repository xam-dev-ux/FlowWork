// Polling system for detecting new tasks without event listeners
// Solves "filter not found" issues with public RPC endpoints

import { ContractClient } from "./contractClient";
import { ethers } from "ethers";

export interface PollingConfig {
  interval: number; // milliseconds between polls
  batchSize: number; // how many tasks to check per poll
}

export class TaskPoller {
  private contractClient: ContractClient;
  private config: PollingConfig;
  private isRunning: boolean = false;
  private lastCheckedTaskId: number = 0;
  private pollInterval: NodeJS.Timeout | null = null;

  // Callbacks
  private onTaskCreatedCallback?: (taskId: number, task: any) => void;
  private onTaskStatusChangeCallback?: (taskId: number, oldStatus: number, newStatus: number) => void;

  constructor(contractClient: ContractClient, config: PollingConfig) {
    this.contractClient = contractClient;
    this.config = config;
  }

  /**
   * Start polling for new tasks
   */
  async start() {
    if (this.isRunning) {
      console.log("⚠️  Poller already running");
      return;
    }

    this.isRunning = true;
    console.log(`🔄 Starting task poller (interval: ${this.config.interval}ms)`);

    // Get current task counter to start from
    try {
      const taskCounter = await this.getTaskCounter();
      this.lastCheckedTaskId = taskCounter;
      console.log(`   Starting from task ID: ${this.lastCheckedTaskId}`);
    } catch (error) {
      console.log(`   Could not get task counter, starting from 0`);
      this.lastCheckedTaskId = 0;
    }

    // Start polling loop
    this.pollInterval = setInterval(() => this.poll(), this.config.interval);

    // Do first poll immediately
    await this.poll();
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("🛑 Task poller stopped");
  }

  /**
   * Register callback for new tasks
   */
  onTaskCreated(callback: (taskId: number, task: any) => void) {
    this.onTaskCreatedCallback = callback;
  }

  /**
   * Register callback for task status changes
   */
  onTaskStatusChange(callback: (taskId: number, oldStatus: number, newStatus: number) => void) {
    this.onTaskStatusChangeCallback = callback;
  }

  /**
   * Poll for new tasks
   */
  private async poll() {
    try {
      const currentTaskCounter = await this.getTaskCounter();
      console.log(`🔄 Poll: Current=${currentTaskCounter}, Last=${this.lastCheckedTaskId}`);

      // Check if there are new tasks
      if (currentTaskCounter > this.lastCheckedTaskId) {
        const newTasksCount = currentTaskCounter - this.lastCheckedTaskId;
        console.log(`\n📥 Detected ${newTasksCount} new task(s)`);

        // Process new tasks
        for (let taskId = this.lastCheckedTaskId + 1; taskId <= currentTaskCounter; taskId++) {
          await this.processTask(taskId, true);
        }

        this.lastCheckedTaskId = currentTaskCounter;
      } else {
        console.log(`   No new tasks`);
      }

      // Also poll recent tasks for status changes (optional, for agent assignment detection)
      // Check last 10 tasks for status updates
      const recentTasksStart = Math.max(1, currentTaskCounter - 10);
      for (let taskId = recentTasksStart; taskId <= currentTaskCounter; taskId++) {
        if (taskId !== currentTaskCounter) {
          // Don't re-process the newest task
          await this.processTask(taskId, false);
        }
      }
    } catch (error: any) {
      console.error(`❌ Polling error:`, error.message);
    }
  }

  /**
   * Process a single task
   */
  private async processTask(taskId: number, isNew: boolean) {
    try {
      console.log(`   📋 Processing task ${taskId}${isNew ? " (NEW)" : ""}...`);
      const task = await this.contractClient.getTask(taskId);
      console.log(`   ✅ Task ${taskId} fetched successfully`);

      // If it's a new task, trigger the callback
      if (isNew && this.onTaskCreatedCallback) {
        console.log(`   🔔 Triggering onTaskCreated callback...`);
        await this.onTaskCreatedCallback(taskId, task);
      }

      // Check for status changes (for detecting agent assignments, deliveries, approvals)
      if (!isNew && this.onTaskStatusChangeCallback) {
        // You could store previous status and compare here
        // For now, we'll just emit status changes
        const status = Number(task.status);
        if (status > 0) {
          // Status changed from Open
          this.onTaskStatusChangeCallback(taskId, 0, status);
        }
      }
    } catch (error: any) {
      // Task might not exist or be accessible
      console.error(`   ❌ Error processing task ${taskId}:`, error.message);
    }
  }

  /**
   * Get current task counter from contract
   */
  private async getTaskCounter(): Promise<number> {
    try {
      // Try to call taskCounter() if it exists
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC || "https://mainnet.base.org");
      const contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS || "",
        ["function taskCounter() external view returns (uint256)"],
        provider
      );

      const counter = await contract.taskCounter();
      return Number(counter);
    } catch (error) {
      // If taskCounter() doesn't exist, try to find the highest task ID by binary search
      return await this.findHighestTaskId();
    }
  }

  /**
   * Find highest task ID using binary search (fallback if no taskCounter)
   */
  private async findHighestTaskId(): Promise<number> {
    let low = 0;
    let high = 10000; // Reasonable upper bound
    let highest = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      try {
        await this.contractClient.getTask(mid);
        // Task exists
        highest = mid;
        low = mid + 1;
      } catch {
        // Task doesn't exist
        high = mid - 1;
      }
    }

    return highest;
  }
}
