// Builder Code Integration for Base Attribution
// Appends your Builder Code to all transactions for onchain analytics

import { Attribution } from "ox/erc8021";

// Your Builder Code from base.dev
export const BUILDER_CODE = "bc_zo9roirq";

// Generate the data suffix for attribution
export const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

/**
 * Appends Builder Code to transaction data for Base attribution
 * @param data - Original transaction data (can be undefined for simple transfers)
 * @returns Transaction data with Builder Code suffix appended
 */
export function addBuilderCode(data?: string): string {
  // If no data, use empty string (for simple ETH transfers)
  const baseData = data || "0x";

  // Remove '0x' prefix if present
  const cleanData = baseData.startsWith("0x") ? baseData.slice(2) : baseData;
  const cleanSuffix = DATA_SUFFIX.startsWith("0x") ? DATA_SUFFIX.slice(2) : DATA_SUFFIX;

  // Append suffix and add back '0x' prefix
  return `0x${cleanData}${cleanSuffix}`;
}

/**
 * Wrapper for ethers.js transactions that automatically adds Builder Code
 * Use this when sending transactions via ethers Contract
 */
export function withBuilderCode<T extends { data?: string }>(tx: T): T {
  return {
    ...tx,
    data: addBuilderCode(tx.data),
  };
}
