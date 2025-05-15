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

// Check if an address is an admin
export async function isAdmin(client: SuiClient, address: string): Promise<boolean> {
  try {
    const adminCapObject = await client.getObject({
      id: CONFIG.ADMIN_CAP_ID,
      options: { showOwner: true },
    })

    if (!adminCapObject.data || !adminCapObject.data.owner) return false

    const owner = adminCapObject.data.owner
    if ("AddressOwner" in owner) {
      return owner.AddressOwner === address
    }
    return false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Get collected fees
export async function getCollectedFees(client: SuiClient): Promise<bigint> {
  try {
    const feeCollectorObject = await client.getObject({
      id: CONFIG.FEE_COLLECTOR_ID,
      options: { showContent: true },
    })

    if (!feeCollectorObject.data || !feeCollectorObject.data.content) return BigInt(0)

    const content = feeCollectorObject.data.content
    if ("fields" in content) {
      // Safely extract balance from fields (handle possible nesting)
      let balance = "0";
      if (content.fields && typeof content.fields === "object") {
        if ("balance" in content.fields) {
          balance = (content.fields as Record<string, any>).balance ?? "0";
        } else if ("fields" in content.fields && "balance" in (content.fields as any).fields) {
          // Handle possible nested fields
          balance = (content.fields as any).fields.balance ?? "0";
        }
      }
      console.log("Raw balance value:", balance); // Debug log
      return BigInt(balance)
    }
    return BigInt(0)
  } catch (error) {
    console.error("Error getting collected fees:", error)
    return BigInt(0)
  }
}

// Build transaction for minting tokens with fee
export function buildMintWithFeeTransaction(amount: number): Transaction {
  const tx = new Transaction()
  
  // Convert to BigInt with proper precision
  const mintFeeBaseUnits = toBaseUnits(CONFIG.MINT_FEE)
  const mintAmountBaseUnits = toBaseUnits(amount)
  
  // Important: We don't need to split a separate coin for the fee
  // The contract will split it from the gas payment
  
  // Call the mint_with_fee function with the gas coin as payment
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::swhit::mint_with_fee`,
    arguments: [
      tx.object(CONFIG.TREASURY_CAP_ID),
      tx.object(CONFIG.FEE_COLLECTOR_ID),
      tx.gas, // Pass the gas coin directly as the payment
      tx.pure.u64(mintAmountBaseUnits),
    ],
  })

  return tx
}
// Build transaction for admin minting tokens
export function buildAdminMintTransaction(amount: number, recipient: string): Transaction {
  const tx = new Transaction()

  // Convert to BigInt with proper precision
  const mintAmountBaseUnits = toBaseUnits(amount)

  // Call the admin_mint function
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::swhit::admin_mint`,
    arguments: [
      tx.object(CONFIG.TREASURY_CAP_ID),
      tx.object(CONFIG.ADMIN_CAP_ID),
      tx.pure.u64(mintAmountBaseUnits),
      tx.pure.address(recipient),
    ],
  })

  return tx
}

// Build transaction for withdrawing specific amount of fees
export function buildWithdrawFeesTransaction(amount: number, recipient: string): Transaction {
  const tx = new Transaction()
  
  // Convert to BigInt with proper precision
  const withdrawAmountBaseUnits = toBaseUnits(amount)

  // Call the withdraw_fees function
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::swhit::withdraw_fees`,
    arguments: [
      tx.object(CONFIG.FEE_COLLECTOR_ID),
      tx.object(CONFIG.ADMIN_CAP_ID),
      tx.pure.u64(withdrawAmountBaseUnits),
      tx.pure.address(recipient),
    ],
  })

  return tx
}

// Build transaction for withdrawing all fees
export function buildWithdrawAllFeesTransaction(): Transaction {
  const tx = new Transaction()

  // Call the withdraw_all_fees function - no recipient needed as it goes to admin
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::swhit::withdraw_all_fees`,
    arguments: [
      tx.object(CONFIG.FEE_COLLECTOR_ID), 
      tx.object(CONFIG.ADMIN_CAP_ID),
    ],
  })

  return tx
}
// Build transaction for burning tokens
export function buildBurnTransaction(coinObjectId: string): Transaction {
  const tx = new Transaction()

  // Call the burn function
  tx.moveCall({
    target: `${CONFIG.PACKAGE_ID}::swhit::burn`,
    arguments: [
      tx.object(CONFIG.TREASURY_CAP_ID), 
      tx.object(CONFIG.ADMIN_CAP_ID), 
      tx.object(coinObjectId)
    ],
  })

  return tx
}

// Validate a token amount is valid and meets minimum requirements
export function validateTokenAmount(amount: string | number): { valid: boolean; error?: string } {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { valid: false, error: "Invalid amount" };
  }
  
  if (numAmount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }
  
  // Check if amount is too small (less than 1 base unit)
  if (numAmount < 1 / CONVERSION_FACTOR) {
    return { 
      valid: false, 
      error: `Amount must be at least ${1 / CONVERSION_FACTOR} SWHIT` 
    };
  }
  
  return { valid: true };
}