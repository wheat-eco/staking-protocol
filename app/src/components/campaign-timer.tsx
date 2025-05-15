"use client"

import { useState, useEffect } from "react"
import styles from "./campaign-timer.module.css"

// Hardcoded campaign end date (UTC)
const END_DATE = new Date("2025-05-31T23:59:59Z")

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function CampaignTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = END_DATE.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        // Campaign ended
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    // Calculate immediately
    calculateTimeLeft()

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000)

    // Clean up
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.timerContainer}>
      <div className={styles.timerHeader}>
        <h3 className={styles.timerTitle}>Campaign Ends In</h3>
      </div>

      <div className={styles.timerGrid}>
        <div className={styles.timerItem}>
          <div className={styles.timerValue}>{timeLeft.days}</div>
          <div className={styles.timerLabel}>Days</div>
        </div>
        <div className={styles.timerSeparator}>:</div>
        <div className={styles.timerItem}>
          <div className={styles.timerValue}>{timeLeft.hours.toString().padStart(2, "0")}</div>
          <div className={styles.timerLabel}>Hours</div>
        </div>
        <div className={styles.timerSeparator}>:</div>
        <div className={styles.timerItem}>
          <div className={styles.timerValue}>{timeLeft.minutes.toString().padStart(2, "0")}</div>
          <div className={styles.timerLabel}>Minutes</div>
        </div>
        <div className={styles.timerSeparator}>:</div>
        <div className={styles.timerItem}>
          <div className={styles.timerValue}>{timeLeft.seconds.toString().padStart(2, "0")}</div>
          <div className={styles.timerLabel}>Seconds</div>
        </div>
      </div>
    </div>
  )
}
