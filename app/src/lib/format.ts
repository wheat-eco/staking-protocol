// Format SUI amount from MIST to SUI with proper formatting
export function formatSUI(amount: number): string {
  const sui = amount / 1_000_000_000
  return (
    new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 9,
    }).format(sui) + " SUI"
  )
}

// Parse SUI amount from user input to MIST
export function parseSUI(amount: string): number {
  const parsed = Number.parseFloat(amount)
  if (isNaN(parsed)) return 0
  return Math.floor(parsed * 1_000_000_000)
}
