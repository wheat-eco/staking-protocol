"use client"

import { useState, useEffect } from "react"
import styles from "./campaign-timer.module.css"

// Hardcoded campaign end date (UTC)
const END_DATE = new Date("2025-05-31T23:59:59Z")
const STORAGE_KEY = "campaign_timer_state"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  lastUpdated: number // timestamp when this was last calculated
}

export function CampaignTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    lastUpdated: 0,
  })

  // Initialize from localStorage or calculate fresh
  useEffect(() => {
    // Try to load saved state
    const loadSavedState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const parsedState = JSON.parse(savedState) as TimeLeft

          // Check if saved state is still valid (not too old)
          const now = Date.now()
          const timeSinceLastUpdate = now - parsedState.lastUpdated

          // If the saved state is less than 10 seconds old, use it
          // Otherwise, calculate fresh values
          if (timeSinceLastUpdate < 10000) {
            // Adjust the time based on how much time has passed since last update
            const secondsPassed = Math.floor(timeSinceLastUpdate / 1000)

            // Convert everything to seconds, subtract elapsed time, then convert back
            let totalSeconds =
              parsedState.days * 86400 +
              parsedState.hours * 3600 +
              parsedState.minutes * 60 +
              parsedState.seconds -
              secondsPassed

            if (totalSeconds <= 0) {
              // Campaign has ended since last save
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, lastUpdated: now })
              return
            }

            // Convert back to days, hours, minutes, seconds
            const days = Math.floor(totalSeconds / 86400)
            totalSeconds %= 86400
            const hours = Math.floor(totalSeconds / 3600)
            totalSeconds %= 3600
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60

            setTimeLeft({ days, hours, minutes, seconds, lastUpdated: now })
            return
          }
        }
      } catch (error) {
        console.error("Error loading timer state:", error)
        // Continue to fresh calculation on error
      }

      // Calculate fresh if no valid saved state
      calculateTimeLeft()
    }

    // Calculate time left and update state
    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = END_DATE.getTime() - now

      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          lastUpdated: now,
        }

        setTimeLeft(newTimeLeft)

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimeLeft))
        } catch (error) {
          console.error("Error saving timer state:", error)
        }
      } else {
        // Campaign ended
        const endState = { days: 0, hours: 0, minutes: 0, seconds: 0, lastUpdated: now }
        setTimeLeft(endState)

        // Clear from localStorage when ended
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
          console.error("Error clearing timer state:", error)
        }
      }
    }

    // Load saved state on initial render
    loadSavedState()

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
