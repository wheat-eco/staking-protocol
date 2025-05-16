"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowRight, Check } from "lucide-react"
import toast from "react-hot-toast"
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { buildMintWithFeeTransaction } from "@/lib/transactions"
import { markTokensAsClaimed, getTotalClaimableTokens } from "@/lib/firebase"
import styles from "./token-claim.module.css"

interface TokenClaimProps {
  walletAddress: string
  onClaim: () => void
}

export function TokenClaim({ walletAddress, onClaim }: TokenClaimProps) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [loading, setLoading] = useState(false)
  const [claimStep, setClaimStep] = useState(0)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Load the total claimable token amount on mount
  useEffect(() => {
    const loadTokenAmount = async () => {
      if (!walletAddress) return

      try {
        setIsLoading(true)
        const amount = await getTotalClaimableTokens(walletAddress)
        setTokenAmount(amount)
      } catch (error) {
        console.error("Error loading token amount:", error)
        toast.error("Failed to load token amount")
      } finally {
        setIsLoading(false)
      }
    }

    loadTokenAmount()
  }, [walletAddress])

  const claimTokens = async () => {
    setLoading(true)
    setClaimStep(1)

    try {
      // Simulate initial processing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setClaimStep(2)

      // Build the transaction - NOTE: buildMintWithFeeTransaction only takes amount, not walletAddress
      const tx = buildMintWithFeeTransaction(tokenAmount)

      // Sign and execute the transaction
      signAndExecute(
        {
          transaction: tx,
          options: {
            showEffects: true,
            showEvents: true,
          },
        },
        {
          onSuccess: async (result) => {
            // This only means the transaction was SUBMITTED, not that it SUCCEEDED
            console.log("Transaction submitted:", result)

            // Store transaction ID for reference
            if (result.digest) {
              setTransactionId(result.digest)
            }

            // Check if the transaction actually succeeded
            // We need to look at the effects.status field
            if (result.effects && result.effects.status && result.effects.status.status === "success") {
              // Transaction was actually successful on the blockchain
              console.log("Transaction confirmed successful on blockchain")
              setClaimStep(3)

              // Simulate final processing
              await new Promise((resolve) => setTimeout(resolve, 1000))

              // NOW it's safe to mark tokens as claimed in Firebase
              await markTokensAsClaimed(walletAddress)

              setClaimStep(4)
              toast.success(`Successfully claimed ${tokenAmount.toLocaleString()} $SWHIT tokens!`)
              onClaim()
            } else {
              // Transaction was submitted but failed on the blockchain
              console.error("Transaction failed on blockchain:", result.effects?.status)
              toast.error("Transaction failed. You may not have enough gas fees.")
              setLoading(false)
              setClaimStep(0)
            }
          },
          onError: (error) => {
            // This happens if the transaction couldn't even be submitted
            console.error("Transaction failed to submit:", error)
            toast.error("Failed to submit transaction")
            setLoading(false)
            setClaimStep(0)
          },
        },
      )
    } catch (error) {
      console.error("Error claiming tokens:", error)
      toast.error("Failed to claim tokens")
      setLoading(false)
      setClaimStep(0)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <span className={styles.loadingSpinner}></span>
            <p>Loading token amount...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.tokenInfo}>
          <div className={styles.tokenIcon}>
            <Image src="/log.png" alt="Token Icon" width={48} height={48} className={styles.icon} priority />
          </div>
          <div className={styles.tokenAmount}>
            <span className={styles.amount}>{tokenAmount.toLocaleString()}</span>
            <span className={styles.symbol}>$SWHIT</span>
          </div>
          <p className={styles.tokenDescription}>Your tokens are ready to claim</p>
        </div>

        {claimStep > 0 && claimStep < 4 && (
          <div className={styles.claimSteps}>
            <div
              className={`${styles.claimStep} ${claimStep >= 1 ? styles.active : ""} ${claimStep > 1 ? styles.completed : ""}`}
            >
              <div className={styles.stepIndicator}>{claimStep > 1 ? <Check className={styles.stepIcon} /> : 1}</div>
              <div className={styles.stepText}>Preparing</div>
            </div>
            <div className={styles.stepConnector}></div>
            <div
              className={`${styles.claimStep} ${claimStep >= 2 ? styles.active : ""} ${claimStep > 2 ? styles.completed : ""}`}
            >
              <div className={styles.stepIndicator}>{claimStep > 2 ? <Check className={styles.stepIcon} /> : 2}</div>
              <div className={styles.stepText}>Processing</div>
            </div>
            <div className={styles.stepConnector}></div>
            <div
              className={`${styles.claimStep} ${claimStep >= 3 ? styles.active : ""} ${claimStep > 3 ? styles.completed : ""}`}
            >
              <div className={styles.stepIndicator}>{claimStep > 3 ? <Check className={styles.stepIcon} /> : 3}</div>
              <div className={styles.stepText}>Finalizing</div>
            </div>
          </div>
        )}

        {transactionId && (
          <div className={styles.transactionInfo}>
            <a
              href={`https://explorer.sui.io/txblock/${transactionId}?network=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerLink}
            >
              View Transaction on Explorer
            </a>
          </div>
        )}

        <button className={styles.claimButton} onClick={claimTokens} disabled={loading}>
          {loading ? (
            <span className={styles.loadingText}>
              {claimStep === 1 && "Preparing..."}
              {claimStep === 2 && "Processing..."}
              {claimStep === 3 && "Finalizing..."}
            </span>
          ) : (
            <>
              <ArrowRight className={styles.buttonIcon} />
              <span>Claim Tokens Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
