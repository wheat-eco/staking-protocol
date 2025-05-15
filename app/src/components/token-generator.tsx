"use client"

import { useState } from "react"
import { Gift, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import { updateTokenAmount } from "@/lib/supabase"
import styles from "./token-generator.module.css"

interface TokenGeneratorProps {
  walletAddress: string
  onGenerate: (amount: number) => void
}

export function TokenGenerator({ walletAddress, onGenerate }: TokenGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedAmount, setGeneratedAmount] = useState<number | null>(null)

  const generateTokenAmount = async () => {
    setLoading(true)
    setGenerating(true)

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate random amount between 100 and 10,000
      const amount = Math.floor(Math.random() * 9900) + 100

      // Simulate number counting animation
      let currentCount = 0
      const increment = Math.max(1, Math.floor(amount / 50))
      const interval = setInterval(() => {
        currentCount += increment
        if (currentCount >= amount) {
          currentCount = amount
          clearInterval(interval)
          setGenerating(false)

          // Save to Supabase
          updateTokenAmount(walletAddress, amount)
            .then(() => {
              onGenerate(amount)
            })
            .catch((error) => {
              console.error("Error updating token amount:", error)
              toast.error("Failed to save token amount")
            })
        }
        setGeneratedAmount(currentCount)
      }, 20)
    } catch (error) {
      console.error("Error generating token amount:", error)
      toast.error("Failed to generate token amount")
      setGenerating(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.giftIcon}>
          <Gift className={styles.icon} />
        </div>
        <h3>Generate Your Random Token Amount</h3>
        <p>Click the button below to generate a random amount of $SWHIT tokens</p>

        {generatedAmount !== null && (
          <div className={styles.amountDisplay}>
            <div className={styles.amountValue}>
              {generatedAmount.toLocaleString()}
              <span className={styles.tokenSymbol}>$SWHIT</span>
            </div>
            {generating && (
              <div className={styles.sparklesContainer}>
                <Sparkles className={styles.sparklesIcon} />
              </div>
            )}
          </div>
        )}

        <button
          className={styles.generateButton}
          onClick={generateTokenAmount}
          disabled={loading || (generatedAmount !== null && !generating)}
        >
          {loading && generating ? (
            <span className={styles.loadingText}>Generating...</span>
          ) : generatedAmount !== null && !generating ? (
            <span>Token Amount Generated!</span>
          ) : (
            <>
              <Gift className={styles.buttonIcon} />
              <span>Generate Random Amount</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
