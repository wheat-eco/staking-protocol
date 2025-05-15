"use client"

import { useEffect, useState } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { WalletConnection } from "@/components/wallet-connection"
import { TwitterConnect } from "@/components/twitter-connect"
import { TokenClaim } from "@/components/token-claim"
import { CampaignTimer } from "@/components/campaign-timer"
import { BackgroundEffect } from "@/components/background-effect"
import { ReferralSystem } from "@/components/referral-system"
import { getUserData, createUserIfNotExists, generateTokenAmount } from "@/lib/firebase"
import { Share } from "lucide-react"
import styles from "./page.module.css"

export default function Home() {
  const account = useCurrentAccount()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showReferral, setShowReferral] = useState(false)

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

        // Create user if not exists
        await createUserIfNotExists(account.address)

        // Get user data
        const data = await getUserData(account.address)

        // If user exists but doesn't have token amount yet, generate it
        if (data && !data.token_amount) {
          const amount = await generateTokenAmount(account.address)
          data.token_amount = amount
        }

        setUserData(data || null)
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [account])

  // Check for referral in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const referralCode = urlParams.get("ref")

    if (referralCode && account) {
      // Process referral
      console.log(`Processing referral: ${referralCode} for user ${account.address}`)
      // This would be implemented in the firebase.ts file
    }
  }, [account])

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
                      <h3>Follow us on X (Twitter)</h3>
                      <p>Follow our official X account to verify your identity</p>
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
                    <ReferralSystem walletAddress={account.address} />
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
                <h2 className={styles.cardTitle}>Follow on X (Twitter)</h2>
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
                ) : !userData?.twitter_connected ? (
                  <div className={styles.connectPrompt}>
                    <p>Follow us on X (Twitter) first</p>
                  </div>
                ) : userData?.token_amount && !userData?.claimed ? (
                  <TokenClaim
                    tokenAmount={userData.token_amount}
                    walletAddress={account.address}
                    onClaim={() => {
                      setUserData({
                        ...userData,
                        claimed: true,
                      })
                    }}
                  />
                ) : userData?.claimed ? (
                  <div className={styles.claimedMessage}>
                    <div className={styles.claimedIcon}>✓</div>
                    <h3>Tokens Claimed!</h3>
                    <p>You've successfully claimed {userData.token_amount.toLocaleString()} $SWHIT tokens</p>
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
                  <div className={styles.connectPrompt}>
                    <p>Something went wrong. Please refresh the page.</p>
                  </div>
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
                You'll receive a random amount of $SWHIT tokens when you connect your wallet and follow our X account.
                The amount varies for each user, ranging from 100 to 10,000 tokens. You can earn additional tokens
                through referrals.
              </p>
            </div>
            <div className={styles.faqCard}>
              <h3>How long will the campaign last?</h3>
              <p>The campaign will last for 5 days only. Make sure to participate before the timer ends!</p>
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
