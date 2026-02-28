export enum TaskStatus {
  Open,
  Assigned,
  Delivered,
  Approved,
  Disputed,
  Cancelled,
}

export enum TaskCategory {
  Copywriting,
  CodeReview,
  DataAnalysis,
  ImagePrompts,
  Research,
  Translation,
  SocialMedia,
  Financial,
  Legal,
  Other,
}

export enum AgentTier {
  Rookie,
  Silver,
  Gold,
  Elite,
}

export interface Task {
  taskId: number;
  client: string;
  assignedAgent: string;
  description: string;
  category: TaskCategory;
  bounty: bigint;
  deadline: number;
  status: TaskStatus;
  ipfsHash: string;
  bidCount: number;
  isRecurring: boolean;
}

export interface Agent {
  xmtpAddress: string;
  basename: string;
  tier: AgentTier;
  reputationScore: number;
  completedTasks: number;
  totalEarnings: bigint;
  pendingEarnings: bigint;
  stake: bigint;
  isActive: boolean;
  specialties?: string[];
}

export interface Bid {
  agent: string;
  price: bigint;
  proposal: string;
  estimatedTime: number;
  submittedAt: number;
}

export const CATEGORY_NAMES: { [key in TaskCategory]: string } = {
  [TaskCategory.Copywriting]: "Copywriting",
  [TaskCategory.CodeReview]: "Code Review",
  [TaskCategory.DataAnalysis]: "Data Analysis",
  [TaskCategory.ImagePrompts]: "Image Prompts",
  [TaskCategory.Research]: "Research",
  [TaskCategory.Translation]: "Translation",
  [TaskCategory.SocialMedia]: "Social Media",
  [TaskCategory.Financial]: "Financial",
  [TaskCategory.Legal]: "Legal",
  [TaskCategory.Other]: "Other",
};

export const STATUS_NAMES: { [key in TaskStatus]: string } = {
  [TaskStatus.Open]: "Open",
  [TaskStatus.Assigned]: "Assigned",
  [TaskStatus.Delivered]: "Delivered",
  [TaskStatus.Approved]: "Approved",
  [TaskStatus.Disputed]: "Disputed",
  [TaskStatus.Cancelled]: "Cancelled",
};

export const TIER_NAMES: { [key in AgentTier]: string } = {
  [AgentTier.Rookie]: "Rookie",
  [AgentTier.Silver]: "Silver",
  [AgentTier.Gold]: "Gold",
  [AgentTier.Elite]: "Elite",
};
