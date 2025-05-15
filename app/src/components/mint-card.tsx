"use client"

import { useState } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { buildMintWithFeeTransaction, formatSUI, formatSWHIT, toBaseUnits, fromBaseUnits } from "@/lib/transactions"
import { CONFIG } from "@/lib/config"
import toast from "react-hot-toast"
import { Loader } from "@/components/ui/loader"

export function MintCard() {
  const account = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const [amount, setAmount] = useState(CONFIG.DEFAULT_MINT_AMOUNT.toString())
  const [loading, setLoading] = useState(false)

  const handleMint = async () => {
    if (!account) return

    // Parse as float to handle decimal inputs properly
    const mintAmount = parseFloat(amount)
    if (isNaN(mintAmount) || mintAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setLoading(true)
    try {
      // Build the transaction with proper precision handling
      const transaction = buildMintWithFeeTransaction(mintAmount)

      const toastId = toast.loading("Minting tokens...")

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result)
            toast.success(`Successfully minted ${amount} SWHIT tokens!`, { id: toastId })
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error(`Transaction failed: ${error.message}`, { id: toastId })
          },
          onSettled: () => {
            setLoading(false)
          },
        }
      )
    } catch (error: any) {
      console.error("Mint error:", error)
      toast.error(`Error: ${error.message}`)
      setLoading(false)
    }
  }

  if (!account) {
    return null
  }

  // Calculate base units for preview
  const baseUnits = amount ? toBaseUnits(parseFloat(amount)) : BigInt(0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mint SWHIT Tokens</CardTitle>
        <CardDescription>
          Mint SWHIT tokens by paying a fee of {formatSUI(toBaseUnits(CONFIG.MINT_FEE))}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Mint</Label>
            <Input
              id="amount"
              type="number"
              placeholder="1.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.000000001"
              step="0.000000001"
              className="input-field"
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>You will receive: {formatSWHIT(baseUnits)}</span>
              <span>Base units: {baseUnits.toString()}</span>
            </div>
          </div>

          <Button onClick={handleMint} disabled={loading || !amount} className="w-full btn-primary">
            {loading ? <Loader size="sm" /> : "Mint Tokens"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}