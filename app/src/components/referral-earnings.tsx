"use client"

import { useState, useEffect } from "react"
import { Gift, Users, ArrowRight, Check } from "lucide-react"
import toast from "react-hot-toast"
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { buildRequestTokensTransaction } from "@/lib/transactions"
import { markReferralBonusAsClaimed, getReferralEarnings } from "@/lib/supabase-client"
import styles from "./referral-earnings.module.css"

interface ReferralEarning {
  id: string
  referrer_bonus: number
  referee_wallet: string
  created_at: string
  claimed: boolean
}

interface ReferralEarningsProps {
  walletAddress: string
  onUpdate?: () => void
}

export function ReferralEarnings({ walletAddress, onUpdate }: ReferralEarningsProps) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [totalUnclaimed, setTotalUnclaimed] = useState(0)
  const [totalClaimed, setTotalClaimed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimStep, setClaimStep] = useState(0)

  useEffect(() => {
    fetchReferralEarnings()
  }, [walletAddress])

  const fetchReferralEarnings = async () => {
    try {
      setLoading(true)
      const data = await getReferralEarnings(walletAddress)

      setEarnings(data.earnings)
      setTotalUnclaimed(data.totalUnclaimed)
      setTotalClaimed(data.totalClaimed)
    } catch (error) {
      console.error("Error fetching referral earnings:", error)
      toast.error("Failed to load referral earnings")
    } finally {
      setLoading(false)
    }
  }

  const claimReferralBonuses = async () => {
    if (totalUnclaimed === 0) {
      toast.error("No referral bonuses to claim")
      return
    }

    setClaiming(true)
    setClaimStep(1)

    try {
      // Step 1: Preparing
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setClaimStep(2)

      // Step 2: Build and execute transaction
      const tx = buildRequestTokensTransaction(totalUnclaimed)

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
            if (result.effects && result.effects.status && result.effects.status.status === "success") {
              setClaimStep(3)

              // Step 3: Mark as claimed in database
              await new Promise((resolve) => setTimeout(resolve, 1000))

              try {
                await markReferralBonusAsClaimed(walletAddress)

                setClaimStep(4)
                toast.success(`Successfully claimed ${totalUnclaimed.toLocaleString()} $SWHIT referral bonuses!`)

                // Refresh data
                await fetchReferralEarnings()
                if (onUpdate) onUpdate()
              } catch (dbError) {
                console.error("Error updating database:", dbError)
                toast.error("Tokens claimed but failed to update records")
              }
            } else {
              throw new Error("Transaction failed on blockchain")
            }
          },
          onError: (error) => {
            console.error("Transaction failed:", error)
            toast.error("Failed to claim referral bonuses. Please try again.")
            setClaiming(false)
            setClaimStep(0)
          },
        },
      )
    } catch (error) {
      console.error("Error claiming referral bonuses:", error)
      toast.error("Failed to claim referral bonuses. Please try again.")
      setClaiming(false)
      setClaimStep(0)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading referral earnings...</p>
        </div>
      </div>
    )
  }

  if (claimStep === 4) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <Check size={48} />
          </div>
          <h3 className={styles.successTitle}>Referral Bonuses Claimed!</h3>
          <p className={styles.successDescription}>
            {totalUnclaimed.toLocaleString()} $SWHIT referral bonuses have been sent to your wallet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Gift size={24} className={styles.unclaimedIcon} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{totalUnclaimed.toLocaleString()}</div>
            <div className={styles.summaryLabel}>Unclaimed Bonuses</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Check size={24} className={styles.claimedIcon} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{totalClaimed.toLocaleString()}</div>
            <div className={styles.summaryLabel}>Claimed Bonuses</div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Users size={24} className={styles.totalIcon} />
          </div>
          <div className={styles.summaryContent}>
            <div className={styles.summaryValue}>{earnings.length}</div>
            <div className={styles.summaryLabel}>Total Referrals</div>
          </div>
        </div>
      </div>

      {/* Claim Button */}
      {totalUnclaimed > 0 && (
        <div className={styles.claimSection}>
          {claiming && claimStep > 0 && (
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

          <button
            className={styles.claimButton}
            onClick={claimReferralBonuses}
            disabled={claiming || totalUnclaimed === 0}
          >
            {claiming ? (
              <span className={styles.loadingText}>
                {claimStep === 1 && "Preparing..."}
                {claimStep === 2 && "Processing..."}
                {claimStep === 3 && "Finalizing..."}
              </span>
            ) : (
              <>
                <Gift className={styles.buttonIcon} />
                <span>Claim {totalUnclaimed.toLocaleString()} $SWHIT Referral Bonuses</span>
                <ArrowRight className={styles.buttonIcon} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Referral History */}
      <div className={styles.historySection}>
        <h3 className={styles.historyTitle}>Referral History</h3>

        {earnings.length > 0 ? (
          <div className={styles.historyList}>
            {earnings.map((earning) => (
              <div
                key={earning.id}
                className={`${styles.historyItem} ${earning.claimed ? styles.claimed : styles.unclaimed}`}
              >
                <div className={styles.historyInfo}>
                  <div className={styles.historyWallet}>
                    Referred: {earning.referee_wallet.slice(0, 8)}...{earning.referee_wallet.slice(-6)}
                  </div>
                  <div className={styles.historyDate}>{new Date(earning.created_at).toLocaleDateString()}</div>
                </div>
                <div className={styles.historyReward}>
                  <div className={styles.rewardAmount}>+{earning.referrer_bonus.toLocaleString()} $SWHIT</div>
                  <div
                    className={`${styles.rewardStatus} ${earning.claimed ? styles.statusClaimed : styles.statusPending}`}
                  >
                    {earning.claimed ? "Claimed" : "Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <h4>No Referrals Yet</h4>
            <p>Share your referral link to start earning bonus tokens!</p>
          </div>
        )}
      </div>
    </div>
  )
}
