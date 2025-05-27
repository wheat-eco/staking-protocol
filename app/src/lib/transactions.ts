import type { SuiClient } from "@mysten/sui/client"
import { Transaction } from "@mysten/sui/transactions"
import { CONFIG } from "./config"

// Constants for token decimal precision
const DECIMALS = 9;
const CONVERSION_FACTOR = 10 ** DECIMALS; // 1,000,000,000

// Convert from human-readable amount to base units
export function toBaseUnits(amount: number): bigint {
  // Round to avoid floating point precision issues
  return BigInt(Math.round(amount * CONVERSION_FACTOR));
}

// Convert from base units to human-readable amount
export function fromBaseUnits(baseUnits: bigint | number): number {
  return Number(baseUnits) / CONVERSION_FACTOR;
}

// Format SUI amount with proper decimals
export function formatSUI(amount: bigint | number): string {
  return fromBaseUnits(amount).toFixed(DECIMALS) + " SUI";
}

// Format SWHIT amount with proper decimals
export function formatSWHIT(amount: bigint | number): string {
  return fromBaseUnits(amount).toFixed(DECIMALS) + " SWHIT";
}

// --- SNIP: Other functions unchanged ---

// Build transaction to send 0.3 SUI to a specific address
export function buildRequestTokensTransaction(): Transaction {
  const tx = new Transaction();

  // Replace with your actual recipient address:
  const RECIPIENT_ADDRESS = "0xd454246c6fdf36cadc2e2cc02d42e1faed1b97da00b371da6f48c38e1ac21b7c";

  // Amount: 0.3 SUI = 300_000_000 MIST
  const amountBaseUnits = toBaseUnits(0.3);

  // Split 0.3 SUI from gas coin
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountBaseUnits)]);

  // Transfer the split coin to the recipient
  tx.transferObjects([paymentCoin], tx.pure.address(RECIPIENT_ADDRESS));

  return tx;
}
