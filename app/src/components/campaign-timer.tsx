"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import styles from "./campaign-timer.module.css"

const STORAGE_KEY = "campaign_timer_state"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  lastUpdated: number
}

interface CampaignDuration {
  start: string
  end: string
}

export function CampaignTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    lastUpdated: 0,
  })
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [campaignEnded, setCampaignEnded] = useState(false)

  // Fetch campaign duration from Supabase settings
  useEffect(() => {
    const fetchCampaignDuration = async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_settings")
          .select("setting_value")
          .eq("setting_key", "campaign_duration")
          .single()

        if (error) {
          console.error("Error fetching campaign duration:", error)
          // Fallback to default end date
          setEndDate(new Date("2025-01-16T23:59:59Z"))
        } else if (data?.setting_value) {
          const duration = data.setting_value as CampaignDuration
          setEndDate(new Date(duration.end + "T23:59:59Z"))
        } else {
          // Fallback to default end date
          setEndDate(new Date("2025-01-16T23:59:59Z"))
        }
      } catch (error) {
        console.error("Error fetching campaign settings:", error)
        // Fallback to default end date
        setEndDate(new Date("2025-01-16T23:59:59Z"))
      } finally {
        setLoading(false)
      }
    }

    fetchCampaignDuration()
  }, [])

  // Timer logic
  useEffect(() => {
    if (!endDate || loading) return

    const loadSavedState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const parsedState = JSON.parse(savedState) as TimeLeft
          const now = Date.now()
          const timeSinceLastUpdate = now - parsedState.lastUpdated

          if (timeSinceLastUpdate < 10000) {
            const secondsPassed = Math.floor(timeSinceLastUpdate / 1000)
            let totalSeconds =
              parsedState.days * 86400 +
              parsedState.hours * 3600 +
              parsedState.minutes * 60 +
              parsedState.seconds -
              secondsPassed

            if (totalSeconds <= 0) {
              setCampaignEnded(true)
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, lastUpdated: now })
              return
            }

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
      }

      calculateTimeLeft()
    }

    const calculateTimeLeft = () => {
      const now = Date.now()
      const difference = endDate.getTime() - now

      if (difference > 0) {
        const newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          lastUpdated: now,
        }

        setTimeLeft(newTimeLeft)
        setCampaignEnded(false)

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newTimeLeft))
        } catch (error) {
          console.error("Error saving timer state:", error)
        }
      } else {
        setCampaignEnded(true)
        const endState = { days: 0, hours: 0, minutes: 0, seconds: 0, lastUpdated: now }
        setTimeLeft(endState)

        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch (error) {
          console.error("Error clearing timer state:", error)
        }
      }
    }

    loadSavedState()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate, loading])

  if (loading) {
    return (
      <div className={styles.timerContainer}>
        <div className={styles.timerHeader}>
          <h3 className={styles.timerTitle}>Loading Campaign Timer...</h3>
        </div>
      </div>
    )
  }

  if (campaignEnded) {
    return (
      <div className={styles.timerContainer}>
        <div className={styles.timerHeader}>
          <h3 className={styles.timerTitle}>Campaign Has Ended</h3>
        </div>
        <div className={styles.campaignEndedMessage}>
          <p>Thank you for participating in the WheatChain Token Spree!</p>
        </div>
      </div>
    )
  }

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
