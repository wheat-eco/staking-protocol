"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowRight, Check, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { buildRequestTokensTransaction } from "@/lib/transactions"
import { markTokensAsClaimed, getTotalClaimableTokens } from "@/lib/supabase-client"
import styles from "./token-claim.module.css"

interface TokenClaimProps {
  walletAddress: string
  onClaim: () => void
  onUpdate?: () => void
}

export function TokenClaim({ walletAddress, onClaim, onUpdate }: TokenClaimProps) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [loading, setLoading] = useState(false)
  const [claimStep, setClaimStep] = useState(0)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load the total claimable token amount on mount
  useEffect(() => {
    const loadTokenAmount = async () => {
      if (!walletAddress) return

      try {
        setIsLoading(true)
        setError(null)
        const amount = await getTotalClaimableTokens(walletAddress)
        setTokenAmount(amount)

        if (amount === 0) {
          setError("No tokens available to claim")
        }
      } catch (error) {
        console.error("Error loading token amount:", error)
        setError("Failed to load token amount")
        toast.error("Failed to load token amount")
      } finally {
        setIsLoading(false)
      }
    }

    loadTokenAmount()
  }, [walletAddress])

  const claimTokens = async () => {
    if (tokenAmount === 0) {
      toast.error("No tokens available to claim")
      return
    }

    setLoading(true)
    setClaimStep(1)
    setError(null)

    try {
      // Step 1: Preparing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setClaimStep(2)

      // Step 2: Build and execute transaction
      const tx = buildRequestTokensTransaction(tokenAmount)

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
            console.log("Transaction submitted:", result)

            // Store transaction ID for reference
            if (result.digest) {
              setTransactionId(result.digest)
            }

            // Check if the transaction actually succeeded
            if (result.effects && result.effects.status && result.effects.status.status === "success") {
              console.log("Transaction confirmed successful on blockchain")
              setClaimStep(3)

              // Step 3: Finalizing
              await new Promise((resolve) => setTimeout(resolve, 1000))

              try {
                // Mark tokens as claimed in Supabase
                await markTokensAsClaimed(walletAddress)

                setClaimStep(4)
                toast.success(`Successfully claimed ${tokenAmount.toLocaleString()} $SWHIT tokens!`)

                // Call callbacks
                onClaim()
                if (onUpdate) {
                  onUpdate()
                }
              } catch (dbError) {
                console.error("Error updating database:", dbError)
                toast.error("Tokens claimed but failed to update records")
              }
            } else {
              // Transaction failed on blockchain
              console.error("Transaction failed on blockchain:", result.effects?.status)
              setError("Transaction failed on blockchain")
              toast.error("Transaction failed. You may not have enough gas fees.")
              setLoading(false)
              setClaimStep(0)
            }
          },
          onError: (error) => {
            console.error("Transaction failed to submit:", error)
            setError("Failed to submit transaction")
            toast.error("Failed to submit transaction. Please try again.")
            setLoading(false)
            setClaimStep(0)
          },
        },
      )
    } catch (error) {
      console.error("Error claiming tokens:", error)
      setError("Failed to claim tokens")
      toast.error("Failed to claim tokens. Please try again.")
      setLoading(false)
      setClaimStep(0)
    }
  }

  const retryLoad = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const amount = await getTotalClaimableTokens(walletAddress)
      setTokenAmount(amount)

      if (amount === 0) {
        setError("No tokens available to claim")
      }
    } catch (error) {
      console.error("Error loading token amount:", error)
      setError("Failed to load token amount")
    } finally {
      setIsLoading(false)
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

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryButton} onClick={retryLoad}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (claimStep === 4) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <Check size={48} />
            </div>
            <h3 className={styles.successTitle}>Tokens Claimed Successfully!</h3>
            <p className={styles.successDescription}>
              {tokenAmount.toLocaleString()} $SWHIT tokens have been sent to your wallet
            </p>
            {transactionId && (
              <a
                href={`https://explorer.sui.io/txblock/${transactionId}?network=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.explorerLink}
              >
                <ExternalLink size={16} />
                View on Explorer
              </a>
            )}
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

        {transactionId && claimStep < 4 && (
          <div className={styles.transactionInfo}>
            <a
              href={`https://explorer.sui.io/txblock/${transactionId}?network=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerLink}
            >
              <ExternalLink size={16} />
              View Transaction on Explorer
            </a>
          </div>
        )}

        <button className={styles.claimButton} onClick={claimTokens} disabled={loading || tokenAmount === 0}>
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
