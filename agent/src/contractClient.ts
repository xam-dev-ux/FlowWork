import { ethers } from "ethers";

const FLOWWORK_ABI = [
  "function createTask(string description, string deliveryFormat, uint8 category, uint256 deadline, uint256 bounty, bool isRecurring, uint256 recurringInterval) external returns (uint256)",
  "function submitBid(uint256 taskId, uint256 price, string proposal, uint256 estimatedTime) external",
  "function selectAgent(uint256 taskId, address agentAddress) external",
  "function submitDelivery(uint256 taskId, string ipfsHash) external",
  "function approveDelivery(uint256 taskId) external",
  "function openDispute(uint256 taskId, string reason) external",
  "function getTask(uint256 taskId) external view returns (tuple(uint256 taskId, address client, address assignedAgent, string description, uint8 category, uint256 bounty, uint256 deadline, uint8 status, string ipfsHash, uint256 bidCount, bool isRecurring))",
  "function getAgent(address agentAddress) external view returns (tuple(string xmtpAddress, string basename, uint8 tier, uint256 reputationScore, uint256 completedTasks, uint256 totalEarnings, uint256 pendingEarnings, uint256 stake, bool isActive))",
  "function getAllAgents() external view returns (address[])",
  "function getAgentSpecialties(address agentAddress) external view returns (string[])",
  "event TaskCreated(uint256 indexed taskId, address indexed client, uint8 category, uint256 bounty, uint256 deadline, string description, bool isRecurring, uint256 recurringInterval)",
  "event AgentAssigned(uint256 indexed taskId, address indexed agent, uint256 price)",
  "event TaskDelivered(uint256 indexed taskId, address indexed agent, string ipfsHash)",
  "event TaskApproved(uint256 indexed taskId, address indexed client, address indexed agent, uint256 amount, uint256 protocolFee, uint256 reviewerFee)",
  "event DisputeOpened(uint256 indexed taskId, address indexed initiator, string reason, address[] reviewers)",
];

export class ContractClient {
  private contract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(contractAddress: string, rpcUrl: string, privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, FLOWWORK_ABI, this.wallet);
  }

  async createTask(
    clientAddress: string,
    description: string,
    deliveryFormat: string,
    category: number,
    deadline: number,
    bounty: number
  ): Promise<number> {
    const tx = await this.contract.createTask(
      description,
      deliveryFormat,
      category,
      deadline,
      bounty,
      false,
      0
    );

    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => {
      try {
        return this.contract.interface.parseLog(log)?.name === "TaskCreated";
      } catch {
        return false;
      }
    });

    if (event) {
      const parsed = this.contract.interface.parseLog(event);
      return Number(parsed?.args.taskId);
    }

    throw new Error("TaskCreated event not found");
  }

  async submitBid(
    agentAddress: string,
    taskId: number,
    price: number,
    proposal: string,
    estimatedTime: number
  ): Promise<void> {
    const tx = await this.contract.submitBid(taskId, price, proposal, estimatedTime);
    await tx.wait();
  }

  async selectAgent(taskId: number, agentAddress: string): Promise<void> {
    const tx = await this.contract.selectAgent(taskId, agentAddress);
    await tx.wait();
  }

  async submitDelivery(taskId: number, ipfsHash: string): Promise<void> {
    const tx = await this.contract.submitDelivery(taskId, ipfsHash);
    await tx.wait();
  }

  async approveDelivery(taskId: number): Promise<void> {
    const tx = await this.contract.approveDelivery(taskId);
    await tx.wait();
  }

  async openDispute(taskId: number, reason: string): Promise<void> {
    const tx = await this.contract.openDispute(taskId, reason);
    await tx.wait();
  }

  async getTask(taskId: number): Promise<any> {
    return await this.contract.getTask(taskId);
  }

  async getAgent(agentAddress: string): Promise<any> {
    const agent = await this.contract.getAgent(agentAddress);
    const specialties = await this.contract.getAgentSpecialties(agentAddress);
    return { ...agent, specialties };
  }

  async getAllAgents(): Promise<string[]> {
    return await this.contract.getAllAgents();
  }

  onTaskCreated(callback: (event: any) => void) {
    this.contract.on("TaskCreated", callback);
  }

  onAgentAssigned(callback: (event: any) => void) {
    this.contract.on("AgentAssigned", callback);
  }

  onTaskDelivered(callback: (event: any) => void) {
    this.contract.on("TaskDelivered", callback);
  }

  onTaskApproved(callback: (event: any) => void) {
    this.contract.on("TaskApproved", callback);
  }

  onDisputeOpened(callback: (event: any) => void) {
    this.contract.on("DisputeOpened", callback);
  }
}
