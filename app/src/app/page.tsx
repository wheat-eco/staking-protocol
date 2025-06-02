"use client"

import { useEffect, useState } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { WalletConnection } from "@/components/wallet-connection"
import { TwitterConnect } from "@/components/twitter-connect"
import { TokenClaim } from "@/components/token-claim"
import { CampaignTimer } from "@/components/campaign-timer"
import { BackgroundEffect } from "@/components/background-effect"
import { ReferralSystem } from "@/components/referral-system"
import { getUserData, createUserIfNotExists, validateReferralCode } from "@/lib/supabase-client"
import { Share } from "lucide-react"
import toast from "react-hot-toast"
import styles from "./page.module.css"

export default function Home() {
  const account = useCurrentAccount()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showReferral, setShowReferral] = useState(false)
  const [allTasksCompleted, setAllTasksCompleted] = useState(false)
  const [referralProcessed, setReferralProcessed] = useState(false)

  // Process referral from URL on page load
  useEffect(() => {
    const processUrlReferral = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const referralCode = urlParams.get("ref")

      if (referralCode && !referralProcessed) {
        // Validate referral code first
        const isValid = await validateReferralCode(referralCode)
        if (isValid) {
          // Store referral code in localStorage for when user connects wallet
          localStorage.setItem("pendingReferral", referralCode)
          toast.success("Referral code detected! Connect your wallet to claim bonus.")
        } else {
          toast.error("Invalid referral code")
        }
        setReferralProcessed(true)
      }
    }

    processUrlReferral()
  }, [referralProcessed])

  // Fetch user data when wallet is connected
  useEffect(() => {
    async function fetchUserData() {
      if (!account) {
        setUserData(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get client info
        const clientInfo = await fetch("/api/client-info")
          .then((res) => res.json())
          .catch(() => ({ ip: null, userAgent: null }))

        // Check for pending referral
        const pendingReferral = localStorage.getItem("pendingReferral")

        // Create user if not exists (with referral processing)
        await createUserIfNotExists(account.address, pendingReferral || undefined, {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
        })

        // Clear pending referral
        if (pendingReferral) {
          localStorage.removeItem("pendingReferral")
          toast.success("Referral bonus applied!")
        }

        // Get updated user data
        const data = await getUserData(account.address)

        // Check if all tasks are completed
        setAllTasksCompleted(data?.tasks_completed || false)

        setUserData(data || null)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Error loading user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [account])

  // Handle when all social tasks are completed
  const handleAllTasksCompleted = () => {
    setAllTasksCompleted(true)
    if (userData) {
      setUserData({
        ...userData,
        tasks_completed: true,
      })
    }
  }

  // Refresh user data
  const refreshUserData = async () => {
    if (account) {
      const data = await getUserData(account.address)
      setUserData(data)
    }
  }

  return (
    <>
      <BackgroundEffect />

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <WalletConnection />
        </header>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              <span className={styles.titleHighlight}>$SWHIT</span> Token Spree
            </h1>
            <p className={styles.subtitle}>
              10 million $SWHIT tokens are being distributed to our community!
              <br />
              Connect your wallet, follow us on X, and claim your tokens now.
            </p>

            <div className={styles.timerWrapper}>
              <CampaignTimer />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Campaign Details</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.campaignDetails}>
                <p>To the WheatChain Community:</p>
                <p>
                  In light of recent delays and the shift in our TGE timeline, we're rolling out a special 10 million
                  $SWHIT Token Spree as a gesture of appreciation and compensation for your patience and continued
                  support!
                </p>
                <div className={styles.steps}>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <div className={styles.stepContent}>
                      <h3>Connect your wallet</h3>
                      <p>Use Sui wallet to connect to our platform</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <div className={styles.stepContent}>
                      <h3>Complete social tasks</h3>
                      <p>Follow us on X, join Telegram and Discord</p>
                    </div>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <div className={styles.stepContent}>
                      <h3>Claim your $SWHIT tokens</h3>
                      <p>Receive tokens directly to your wallet</p>
                    </div>
                  </div>
                </div>
                <div className={styles.referralPromo}>
                  <div className={styles.referralIcon}>
                    <Share size={24} />
                  </div>
                  <div className={styles.referralText}>
                    <h3>Earn More Tokens!</h3>
                    <p>Share your referral link and earn additional tokens when friends join the campaign</p>
                  </div>
                  <button className={styles.referralButton} onClick={() => setShowReferral(!showReferral)}>
                    {showReferral ? "Hide Referral" : "Get Referral Link"}
                  </button>
                </div>
                {showReferral && account && (
                  <div className={styles.referralSection}>
                    <ReferralSystem walletAddress={account.address} onUpdate={refreshUserData} />
                  </div>
                )}
                <p className={styles.campaignNote}>
                  It's completely free and open to all community members.
                  <br />
                  <strong>Duration: Only 15 days, so don't miss out!</strong>
                </p>
                <p>
                  This is our way of saying thank you for standing by us. We're building stronger, and this is just the
                  beginning.
                </p>
                <p className={styles.signature}>— Team WheatChain</p>
              </div>
            </div>
          </div>

          <div className={styles.actionCards}>
            <div className={styles.actionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Complete Social Tasks</h2>
              </div>
              <div className={styles.cardBody}>
                <TwitterConnect
                  walletAddress={account?.address}
                  isConnected={userData?.twitter_connected ? true : false}
                  onConnect={() => {
                    setUserData({
                      ...userData,
                      twitter_connected: true,
                    })
                  }}
                  onAllTasksCompleted={handleAllTasksCompleted}
                  onUpdate={refreshUserData}
                />
              </div>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Claim Tokens</h2>
              </div>
              <div className={styles.cardBody}>
                {!account ? (
                  <div className={styles.connectPrompt}>
                    <p>Connect your wallet to claim tokens</p>
                  </div>
                ) : !allTasksCompleted ? (
                  <div className={styles.connectPrompt}>
                    <p>Complete all social tasks first</p>
                  </div>
                ) : userData?.claimed ? (
                  <div className={styles.claimedMessage}>
                    <div className={styles.claimedIcon}>✓</div>
                    <h3>Tokens Claimed!</h3>
                    <p>You've successfully claimed your $SWHIT tokens</p>
                    <button className={styles.shareButton} onClick={() => setShowReferral(true)}>
                      <Share size={16} />
                      <span>Share & Earn More</span>
                    </button>
                  </div>
                ) : loading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Preparing your tokens...</p>
                  </div>
                ) : (
                  <TokenClaim
                    walletAddress={account.address}
                    onClaim={() => {
                      setUserData({
                        ...userData,
                        claimed: true,
                      })
                    }}
                    onUpdate={refreshUserData}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqCard}>
              <h3>What is the $SWHIT Token Spree?</h3>
              <p>
                The $SWHIT Token Spree is a special 10 million token giveaway to our community members as a gesture of
                appreciation for your patience and continued support.
              </p>
            </div>
            <div className={styles.faqCard}>
              <h3>How many tokens can I receive?</h3>
              <p>
                You'll receive a random amount of $SWHIT tokens when you connect your wallet and complete the social
                tasks. The amount varies for each user, ranging from 100 to 10,000 tokens, plus bonuses for completing
                tasks. You can earn additional tokens through referrals.
              </p>
            </div>
            <div className={styles.faqCard}>
              <h3>How long will the campaign last?</h3>
              <p>The campaign will last for 15 days only. Make sure to participate before the timer ends!</p>
            </div>
            <div className={styles.faqCard}>
              <h3>How does the referral system work?</h3>
              <p>
                After connecting your wallet, you'll get a unique referral link. Share this link with friends, and when
                they join using your link, both you and your friend will receive additional tokens.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2025 WheatChain. All rights reserved.</p>
        </footer>
      </div>
    </>
  )
}
