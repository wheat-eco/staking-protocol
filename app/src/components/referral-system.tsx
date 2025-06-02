"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Copy, Share2, Users, Gift, Check } from "lucide-react"
import toast from "react-hot-toast"
import { getUserReferralCode, getReferralStats } from "@/lib/supabase-client"
import styles from "./referral-system.module.css"

interface ReferralSystemProps {
  walletAddress: string
  onUpdate?: () => void
}

export function ReferralSystem({ walletAddress, onUpdate }: ReferralSystemProps) {
  const [referralCode, setReferralCode] = useState<string>("")
  const [referralLink, setReferralLink] = useState<string>("")
  const [referralStats, setReferralStats] = useState({ count: 0, bonus: 0 })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchReferralData() {
      try {
        setLoading(true)

        // Get referral code
        const code = await getUserReferralCode(walletAddress)
        if (code) {
          setReferralCode(code)

          // Create referral link
          const baseUrl = window.location.origin
          const link = `${baseUrl}?ref=${code}`
          setReferralLink(link)
        }

        // Get referral stats
        const stats = await getReferralStats(walletAddress)
        setReferralStats(stats)
      } catch (error) {
        console.error("Error fetching referral data:", error)
        toast.error("Failed to load referral data")
      } finally {
        setLoading(false)
      }
    }

    if (walletAddress) {
      fetchReferralData()
    }
  }, [walletAddress])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success("Referral link copied to clipboard!")

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = referralLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      setCopied(true)
      toast.success("Referral link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOnTwitter = () => {
    const text = "I just claimed my $SWHIT tokens in the WheatChain Token Spree! 🚀 Join me and claim yours too!"
    const hashtags = "WheatChain,SWHIT,Crypto,Airdrop"
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}&hashtags=${hashtags}`
    window.open(url, "_blank", "width=550,height=420")
  }

  const shareGeneric = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "WheatChain $SWHIT Token Spree",
          text: "Join me in claiming $SWHIT tokens!",
          url: referralLink,
        })
        .catch(console.error)
    } else {
      copyToClipboard()
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading referral data...</p>
      </div>
    )
  }

  if (!referralCode) {
    return (
      <div className={styles.error}>
        <p>Unable to load referral data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Referral Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Users size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{referralStats.count}</div>
            <div className={styles.statLabel}>Referrals</div>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>
            <Gift size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{referralStats.bonus.toLocaleString()}</div>
            <div className={styles.statLabel}>Bonus Tokens</div>
          </div>
        </div>
      </div>

      {/* Referral Code Display */}
      <div className={styles.codeContainer}>
        <p className={styles.codeLabel}>Your Referral Code</p>
        <div className={styles.codeDisplay}>
          <span className={styles.codeText}>{referralCode}</span>
        </div>
      </div>

      {/* Referral Link */}
      <div className={styles.referralLinkContainer}>
        <p className={styles.referralLabel}>Your Referral Link</p>
        <div className={styles.referralLinkBox}>
          <input
            type="text"
            value={referralLink}
            readOnly
            className={styles.referralInput}
            onClick={(e) => e.currentTarget.select()}
          />
          <button
            className={`${styles.copyButton} ${copied ? styles.copied : ""}`}
            onClick={copyToClipboard}
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className={styles.shareOptions}>
        <p className={styles.shareLabel}>Share with friends</p>
        <div className={styles.shareButtons}>
          <button
            className={`${styles.shareButton} ${styles.twitterButton}`}
            onClick={shareOnTwitter}
            title="Share on Twitter"
          >
            <Image src="/x-1.png" alt="Twitter" width={16} height={16} />
            <span>Share on X</span>
          </button>

          <button className={`${styles.shareButton} ${styles.genericButton}`} onClick={shareGeneric} title="Share link">
            <Share2 size={16} />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Referral Info */}
      <div className={styles.referralInfo}>
        <div className={styles.infoCard}>
          <h4>How it works:</h4>
          <ul>
            <li>Share your referral link with friends</li>
            <li>When they join using your link, you both get bonus tokens</li>
            <li>
              You earn <strong>500 tokens</strong> per successful referral
            </li>
            <li>
              Your friend gets <strong>250 bonus tokens</strong> for joining
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
