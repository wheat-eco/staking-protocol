"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Copy, Share2, Twitter, Facebook } from "lucide-react"
import toast from "react-hot-toast"
import { getReferralCode, getReferralStats } from "@/lib/firebase"
import styles from "./referral-system.module.css"

interface ReferralSystemProps {
  walletAddress: string
}

export function ReferralSystem({ walletAddress }: ReferralSystemProps) {
  const [referralCode, setReferralCode] = useState<string>("")
  const [referralLink, setReferralLink] = useState<string>("")
  const [referralStats, setReferralStats] = useState({ count: 0, bonus: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReferralData() {
      try {
        // Get referral code
        const code = await getReferralCode(walletAddress)
        setReferralCode(code)

        // Create referral link
        const baseUrl = window.location.origin
        const link = `${baseUrl}?ref=${code}`
        setReferralLink(link)

        // Get referral stats
        const stats = await getReferralStats(walletAddress)
        setReferralStats(stats)
      } catch (error) {
        console.error("Error fetching referral data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferralData()
  }, [walletAddress])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success("Referral link copied to clipboard!")
  }

  const shareOnTwitter = () => {
    const text = "I just claimed my $SWHIT tokens in the WheatChain Token Spree! Join me and claim yours too! 🚀"
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`
    window.open(url, "_blank")
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading referral data...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.statsContainer}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{referralStats.count}</div>
          <div className={styles.statLabel}>Referrals</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{referralStats.bonus.toLocaleString()}</div>
          <div className={styles.statLabel}>Bonus Tokens</div>
        </div>
      </div>

      <div className={styles.referralLinkContainer}>
        <p className={styles.referralLabel}>Your Referral Link</p>
        <div className={styles.referralLinkBox}>
          <input type="text" value={referralLink} readOnly className={styles.referralInput} />
          <button className={styles.copyButton} onClick={copyToClipboard}>
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div className={styles.shareOptions}>
        <p className={styles.shareLabel}>Share with friends</p>
        <div className={styles.shareButtons}>
            <button className={`${styles.shareButton} ${styles.twitterButton}`} onClick={shareOnTwitter}>
            <Image src="/x-1.png" alt="Twitter" width={16} height={16} />
            <span>Twitter</span>
            </button>
        
          <button className={`${styles.shareButton} ${styles.genericButton}`} onClick={copyToClipboard}>
            <Share2 size={16} />
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      <div className={styles.referralInfo}>
        <p>For each friend who joins using your link, you'll both receive bonus tokens!</p>
      </div>
    </div>
  )
}
