"use client"

import { useState, useEffect } from "react"
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isAdmin,
  buildAdminMintTransaction,
  buildWithdrawAllFeesTransaction,
  buildWithdrawFeesTransaction,
  formatSUI,
} from "@/lib/transactions"
import toast from "react-hot-toast"
import { Loader } from "@/components/ui/loader"

export function AdminPanel() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const [loading, setLoading] = useState(true)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Admin mint
  const [mintAmount, setMintAmount] = useState("")
  const [mintRecipient, setMintRecipient] = useState("")

  // Withdraw fees
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawRecipient, setWithdrawRecipient] = useState("")

  useEffect(() => {
    if (!account) return

    const checkAdminStatus = async () => {
      setLoading(true)
      try {
        // Check admin status
        const adminStatus = await isAdmin(client, account.address)
        setIsAdminUser(adminStatus)
      } catch (error) {
        console.error("Error checking admin status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [account, client])

  const handleAdminMint = async () => {
    if (!account || !isAdminUser) return

    const amount = parseFloat(mintAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!mintRecipient || !mintRecipient.startsWith("0x")) {
      toast.error("Please enter a valid recipient address")
      return
    }

    setActionLoading(true)
    try {
      // Build the transaction
      const transaction = buildAdminMintTransaction(amount, mintRecipient)

      const toastId = toast.loading("Minting tokens as admin...")

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result)
            toast.success(`Successfully minted ${amount} SWHIT tokens to ${mintRecipient}!`, { id: toastId })
            setMintAmount("")
            setMintRecipient("")
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error(`Transaction failed: ${error.message}`, { id: toastId })
          },
          onSettled: () => {
            setActionLoading(false)
          },
        },
      )
    } catch (error: any) {
      console.error("Admin mint error:", error)
      toast.error(`Error: ${error.message}`)
      setActionLoading(false)
    }
  }

  const handleWithdrawFees = async () => {
    if (!account || !isAdminUser) return

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!withdrawRecipient || !withdrawRecipient.startsWith("0x")) {
      toast.error("Please enter a valid recipient address")
      return
    }

    setActionLoading(true)
    try {
      // Build the transaction
      const transaction = buildWithdrawFeesTransaction(amount, withdrawRecipient)

      const toastId = toast.loading("Withdrawing fees...")

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result)
            toast.success(`Successfully withdrew fees to ${withdrawRecipient}!`, { id: toastId })
            setWithdrawAmount("")
            setWithdrawRecipient("")
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error(`Transaction failed: ${error.message}`, { id: toastId })
          },
          onSettled: () => {
            setActionLoading(false)
          },
        },
      )
    } catch (error: any) {
      console.error("Withdraw fees error:", error)
      toast.error(`Error: ${error.message}`)
      setActionLoading(false)
    }
  }

  const handleWithdrawAllFees = async () => {
    if (!account || !isAdminUser) return

    setActionLoading(true)
    try {
      // Build the transaction - no recipient needed as it goes to admin
      const transaction = buildWithdrawAllFeesTransaction()

      const toastId = toast.loading("Withdrawing all fees...")

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            console.log("Transaction successful:", result)
            toast.success(`Successfully withdrew all fees to admin address!`, {
              id: toastId,
            })
            setWithdrawAmount("")
            setWithdrawRecipient("")
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error(`Transaction failed: ${error.message}`, { id: toastId })
          },
          onSettled: () => {
            setActionLoading(false)
          },
        },
      )
    } catch (error: any) {
      console.error("Withdraw all fees error:", error)
      toast.error(`Error: ${error.message}`)
      setActionLoading(false)
    }
  }

  if (!account) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isAdminUser) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>Manage the SWHIT token as an admin</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mint">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="mint">Admin Mint</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="mint">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mintAmount">Amount to Mint</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  placeholder="100"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  min="0.000000001"
                  step="0.000000001"
                  className="input-field"
                  disabled={actionLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mintRecipient">Recipient Address</Label>
                <Input
                  id="mintRecipient"
                  placeholder="0x..."
                  value={mintRecipient}
                  onChange={(e) => setMintRecipient(e.target.value)}
                  className="input-field"
                  disabled={actionLoading}
                />
              </div>

              <Button
                onClick={handleAdminMint}
                disabled={actionLoading || !mintAmount || !mintRecipient}
                className="w-full btn-primary mt-4"
              >
                {actionLoading ? <Loader size="sm" /> : "Mint Tokens (Admin)"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="withdraw">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Partial withdrawal section */}
                <div className="space-y-4 border border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium">Partial Withdrawal</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="withdrawRecipient">Recipient Address</Label>
                    <Input
                      id="withdrawRecipient"
                      placeholder="0x..."
                      value={withdrawRecipient}
                      onChange={(e) => setWithdrawRecipient(e.target.value)}
                      className="input-field"
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdrawAmount">Amount to Withdraw</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="0.000000001"
                      step="0.000000001"
                      className="input-field"
                      disabled={actionLoading}
                    />
                  </div>

                  <Button
                    onClick={handleWithdrawFees}
                    disabled={actionLoading || !withdrawAmount || !withdrawRecipient}
                    className="w-full btn-primary"
                  >
                    {actionLoading ? <Loader size="sm" /> : "Withdraw Amount"}
                  </Button>
                </div>

                {/* Withdraw all section */}
                <div className="space-y-4 border border-gray-700 rounded-lg p-4">
                  <h3 className="font-medium">Withdraw All Fees</h3>
                  <p className="text-sm text-gray-400">
                    All fees will be sent to the admin address associated with the AdminCap.
                  </p>
                  
                  <Button
                    onClick={handleWithdrawAllFees}
                    disabled={actionLoading}
                    className="w-full btn-secondary"
                  >
                    {actionLoading ? <Loader size="sm" /> : "Withdraw All Fees"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}