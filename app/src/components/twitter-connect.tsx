"use client"

import { useState } from "react"
import Image from "next/image"
import { Twitter, Check, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import { connectTwitterAccount } from "@/lib/firebase"
import styles from "./twitter-connect.module.css"

interface TwitterConnectProps {
  walletAddress?: string
  isConnected: boolean
  onConnect: () => void
}

export function TwitterConnect({ walletAddress, isConnected, onConnect }: TwitterConnectProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first")
      return
    }

    setLoading(true)

    try {
      // Open Twitter in a new window to follow
      const twitterWindow = window.open("https://x.com/wheatchain_xyz", "_blank")

      // Wait for user to follow and return
      setTimeout(async () => {
        // In a real implementation, we would verify the follow status
        // For this demo, we'll assume the user followed

        // Connect Twitter account in Firebase
        await connectTwitterAccount(walletAddress)

        // Close the Twitter window if it's still open
        if (twitterWindow && !twitterWindow.closed) {
          twitterWindow.close()
        }

        onConnect()
        toast.success("Twitter account connected successfully!")
        setLoading(false)
      }, 20000) // <-- Changed from 5000 to 20000 (20 seconds)
    } catch (error) {
      console.error("Error connecting Twitter:", error)
      toast.error("Failed to connect Twitter account")
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {isConnected ? (
        <div className={styles.connectedState}>
          <div className={styles.connectedIcon}>
            <Check className={styles.checkIcon} />
          </div>
          <div className={styles.connectedText}>
            <h3>Following WheatChain</h3>
            <p>You're now following our official X account</p>
          </div>
        </div>
      ) : (
        <div className={styles.connectState}>
          <div className={styles.twitterLogo}>
            <img src="/x-1.png" alt="Twitter" className={styles.twitterIcon} />
          </div>
          <h3>Follow WheatChain on X</h3>
          <p>Follow our official X account to verify your identity and participate in the token spree</p>
          <button className={styles.connectButton} onClick={handleConnect} disabled={loading || !walletAddress}>
            {loading ? (
              <span className={styles.loadingSpinner}></span>
            ) : (
              <>
                <img src="/x-1.png" alt="Twitter" className={styles.buttonIcon} />
                <span>Follow on X</span>
                <ExternalLink className={styles.externalIcon} />
              </>
            )}
          </button>
          {!walletAddress && <p className={styles.walletWarning}>Connect your wallet first</p>}
        </div>
      )}
    </div>
  )
}
