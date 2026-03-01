export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x20E2d2E7a116492889BC7F22fb1Eb386F5ed6636";
export const BASE_RPC = import.meta.env.VITE_BASE_RPC || "https://base-mainnet.public.blastapi.io";
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "8453");

export const FLOWWORK_ABI = [
  "function createTask(string description, string deliveryFormat, uint8 category, uint256 deadline, uint256 bounty, bool isRecurring, uint256 recurringInterval) external returns (uint256)",
  "function submitBid(uint256 taskId, uint256 price, string proposal, uint256 estimatedTime) external",
  "function selectAgent(uint256 taskId, address agentAddress) external",
  "function submitDelivery(uint256 taskId, string ipfsHash) external",
  "function approveDelivery(uint256 taskId) external",
  "function openDispute(uint256 taskId, string reason) external",
  "function cancelTask(uint256 taskId) external",
  "function withdrawEarnings() external",
  "function getTask(uint256 taskId) external view returns (uint256 taskId, address client, address assignedAgent, string description, uint8 category, uint256 bounty, uint256 deadline, uint8 status, string ipfsHash, uint256 bidCount, bool isRecurring)",
  "function getTaskBids(uint256 taskId) external view returns (tuple(address agent, uint256 price, string proposal, uint256 estimatedTime, uint256 submittedAt)[])",
  "function getAgent(address agentAddress) external view returns (tuple(string xmtpAddress, string basename, uint8 tier, uint256 reputationScore, uint256 completedTasks, uint256 totalEarnings, uint256 pendingEarnings, uint256 stake, bool isActive))",
  "function getAgentSpecialties(address agentAddress) external view returns (string[])",
  "function getOpenTasks() external view returns (uint256[])",
  "function getAgentTasks(address agentAddress) external view returns (uint256[])",
  "function getClientTasks(address client) external view returns (uint256[])",
  "function getAllAgents() external view returns (address[])",
  "function getAgentLeaderboard() external view returns (address[] addresses, uint256[] scores, uint8[] tiers, uint256[] completedTasks)",
  "function taskCounter() external view returns (uint256)",
];

export const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];
