"use client"

import { useState, useEffect } from "react"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserNFTs } from "@/lib/transactions"
import { Loader } from "@/components/ui/loader"

type NFT = {
  id: string
  name: string
  description: string
  url: string
}

export function NFTGallery() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [loading, setLoading] = useState(true)
  const [nfts, setNfts] = useState<NFT[]>([])

  useEffect(() => {
    if (!account) return

    const fetchNFTs = async () => {
      setLoading(true)
      try {
        const userNFTs = await getUserNFTs(client, account.address)
        setNfts(userNFTs)
      } catch (error) {
        console.error("Error fetching NFTs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [account, client])

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your NFT Collection</CardTitle>
          <CardDescription>Connect your wallet to view your NFTs</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your NFT Collection</CardTitle>
          <CardDescription>You don't own any WheatChain TGE Pass NFTs yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">Mint a WheatChain TGE Pass to see it here</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your NFT Collection</CardTitle>
        <CardDescription>Your WheatChain TGE Pass NFTs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft) => (
            <div key={nft.id} className="glass-card overflow-hidden rounded-lg">
              <div className="aspect-square">
                <img src={nft.url || "/placeholder.svg"} alt={nft.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-bold">{nft.name}</h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{nft.description}</p>
                <div className="mt-2 text-xs text-gray-500">ID: {nft.id.slice(0, 8)}...</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
