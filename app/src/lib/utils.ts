import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Format SUI amount from MIST to SUI with proper formatting
export function formatSUI(amount: number | bigint): string {
  const sui = typeof amount === "bigint" ? Number(amount) / 1_000_000_000 : amount / 1_000_000_000

  return (
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(sui) + " SUI"
  )
}

// Format token amount with proper decimals
export function formatToken(amount: number | bigint, decimals = 9): string {
  const value = typeof amount === "bigint" ? Number(amount) / Math.pow(10, decimals) : amount / Math.pow(10, decimals)

  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Format address to shortened form
export function formatAddress(address: string): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Parse token amount to smallest unit
export function parseTokenAmount(amount: string, decimals = 9): bigint {
  const parsed = Number.parseFloat(amount)
  if (isNaN(parsed)) return BigInt(0)
  return BigInt(Math.floor(parsed * Math.pow(10, decimals)))
}
