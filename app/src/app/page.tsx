"use client"

import { WalletConnection } from "@/components/wallet-connection"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"

export default function Home() {
  const account = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (account) {
      toast.success(`Wallet connected: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`)
    }
  }, [account])

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Wallet Header */}
        <WalletConnection />

        <div className="mt-24 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin w-10 h-10 text-white" />
              <p className="text-gray-400 text-lg">Initializing wallet connection...</p>
            </div>
          ) : account ? (
            <div>
              <h1 className="text-4xl font-bold mb-4">Welcome to WheatChain 🌾</h1>
              <p className="text-xl text-gray-400">You're connected and ready to explore.</p>
            </div>
          ) : (
            <div>
              <h1 className="text-4xl font-bold mb-4">WheatChain NFT Marketplace</h1>
              <p className="text-xl text-gray-400">Connect your wallet to get started.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
