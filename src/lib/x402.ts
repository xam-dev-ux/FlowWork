/**
 * x402 Payment Integration for FlowWork
 * Enables instant USDC payments for tips and incentives
 * Minimum payment: 0.000001 USDC
 */

import { ethers } from "ethers";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
const BASE_CHAIN_ID = "8453";
const MIN_PAYMENT = "0.000001"; // Minimum payment amount

export interface X402PaymentRequest {
  recipient: string;
  amount: string;
  description: string;
  requestId: string;
  createdAt: number;
}

export interface X402PaymentStatus {
  status: "pending" | "paid" | "expired";
  txHash?: string;
  paidAt?: number;
}

/**
 * Validate payment amount
 */
export function validateAmount(amount: string): { valid: boolean; error?: string } {
  const numAmount = parseFloat(amount);
  const minAmount = parseFloat(MIN_PAYMENT);

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: "Invalid amount" };
  }

  if (numAmount < minAmount) {
    return { valid: false, error: `Minimum payment is ${MIN_PAYMENT} USDC` };
  }

  return { valid: true };
}

/**
 * Create a payment request
 */
export function createPaymentRequest(
  recipient: string,
  amount: string,
  description: string
): X402PaymentRequest {
  const validation = validateAmount(amount);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    recipient,
    amount,
    description,
    requestId: `x402_${timestamp}_${random}`,
    createdAt: timestamp,
  };
}

/**
 * Generate Coinbase Pay link
 */
export function generateCoinbasePayLink(request: X402PaymentRequest): string {
  const params = new URLSearchParams({
    recipient: request.recipient,
    amount: request.amount,
    asset: "USDC",
    chain: "base",
    memo: request.description,
  });

  return `https://pay.coinbase.com?${params.toString()}`;
}

/**
 * Generate direct USDC transfer link (for Coinbase Wallet)
 */
export function generateWalletLink(request: X402PaymentRequest): string {
  const amountInWei = ethers.parseUnits(request.amount, 6); // USDC = 6 decimals

  // EIP-681 format
  return `ethereum:${USDC_ADDRESS}@${BASE_CHAIN_ID}/transfer?address=${request.recipient}&uint256=${amountInWei}`;
}

/**
 * Check if payment was received
 */
export async function verifyPayment(
  provider: ethers.Provider,
  request: X402PaymentRequest,
  senderAddress?: string
): Promise<X402PaymentStatus> {
  const usdcContract = new ethers.Contract(
    USDC_ADDRESS,
    ["event Transfer(address indexed from, address indexed to, uint256 value)"],
    provider
  );

  const expectedAmount = ethers.parseUnits(request.amount, 6);
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 1000); // ~1 hour ago

  const filter = senderAddress
    ? usdcContract.filters.Transfer(senderAddress, request.recipient)
    : usdcContract.filters.Transfer(null, request.recipient);

  const events = await usdcContract.queryFilter(filter, fromBlock, currentBlock);

  // Look for matching payment
  for (const event of events) {
    const tx = await event.getTransaction();
    if (!tx) continue;

    // Check if payment is recent enough (within 1 hour of request)
    const block = await event.getBlock();
    const blockTime = block.timestamp * 1000;

    // Type guard for EventLog
    if ("args" in event && blockTime >= request.createdAt && event.args && event.args.value >= expectedAmount) {
      return {
        status: "paid",
        txHash: event.transactionHash,
        paidAt: block.timestamp,
      };
    }
  }

  // Check if expired (1 hour timeout)
  if (Date.now() - request.createdAt > 3600000) {
    return { status: "expired" };
  }

  return { status: "pending" };
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 0.01) {
    return `${num.toFixed(2)} USDC`;
  }
  return `${num.toFixed(6)} USDC`;
}

export const MIN_X402_PAYMENT = MIN_PAYMENT;
