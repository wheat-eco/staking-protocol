"use client"

import { useState, useEffect } from "react"
import { Check, ExternalLink } from "lucide-react"
import toast from "react-hot-toast"
import {
  connectTwitterAccount,
  joinTelegramCommunity,
  joinDiscordChannel,
  getUserData,
  updateTotalTokenAmount,
} from "@/lib/firebase"
import styles from "./twitter-connect.module.css"

// Task configuration - can be moved to Firestore for dynamic updates
const SOCIAL_TASKS = [
  {
    id: "twitter",
    name: "Follow WheatChain on X",
    description: "Follow our official X account to verify your identity",
    icon: "/x-1.png",
    link: "https://x.com/wheatchain_xyz",
    connectFunction: connectTwitterAccount,
    waitTime: 20000, // 20 seconds
  },
  {
    id: "telegram",
    name: "Join Telegram Community",
    description: "Join our Telegram community for updates and discussions",
    icon: "/telegram.png",
    link: "https://t.me/swhit_tgchat",
    connectFunction: joinTelegramCommunity,
    waitTime: 20000, // 20 seconds
  },
  {
    id: "discord",
    name: "Join Discord Channel",
    description: "Join our Discord server to connect with the community",
    icon: "/discord.png",
    link: "https://discord.gg/zVsYfGkNDa",
    connectFunction: joinDiscordChannel,
    waitTime: 20000, // 20 seconds
  },
]

interface TwitterConnectProps {
  walletAddress?: string
  isConnected: boolean
  onConnect: () => void
  onAllTasksCompleted?: () => void
}

export function TwitterConnect({ walletAddress, isConnected, onConnect, onAllTasksCompleted }: TwitterConnectProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [rewards, setRewards] = useState<Record<string, number>>({})
  const [allTasksCompleted, setAllTasksCompleted] = useState(false)
  const [totalReward, setTotalReward] = useState(0)

  // Load user data and task completion status on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!walletAddress) return

      try {
        const userData = await getUserData(walletAddress)
        if (userData) {
          // Initialize completed tasks from user data
          const completedTasks: Record<string, boolean> = {}

          SOCIAL_TASKS.forEach((task) => {
            const isCompleted = userData[`${task.id}_connected`] === true
            completedTasks[task.id] = isCompleted
          })

          setCompleted(completedTasks)

          // Check if all tasks are completed
          const allDone = SOCIAL_TASKS.every((task) => completedTasks[task.id])
          setAllTasksCompleted(allDone)

          // If all tasks are completed, notify parent component
          if (allDone && onAllTasksCompleted) {
            onAllTasksCompleted()
          }

          // Load rewards if they exist
          const taskRewards: Record<string, number> = {}
          let socialRewardsTotal = 0

          SOCIAL_TASKS.forEach((task) => {
            const reward = userData[`${task.id}_reward`] || 0
            taskRewards[task.id] = reward
            socialRewardsTotal += reward
          })

          setRewards(taskRewards)
          setTotalReward(socialRewardsTotal)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserData()
  }, [walletAddress, onAllTasksCompleted])

  const handleTaskConnect = async (taskId: string) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first")
      return
    }

    // Find the task
    const task = SOCIAL_TASKS.find((t) => t.id === taskId)
    if (!task) return

    // Check if already completed
    if (completed[taskId]) {
      toast.success(`You've already completed this task!`)
      return
    }

    // Set loading state for this task
    setLoading((prev) => ({ ...prev, [taskId]: true }))

    try {
      // Open the link in a new window
      const socialWindow = window.open(task.link, "_blank")

      // Show a simple loading toast without mentioning the wait time
      const toastId = toast.loading(`Connecting to ${task.name.split(" ").pop()}...`)

      // Wait for user to complete the task (silently)
      setTimeout(async () => {
        try {
          // Connect account in Firebase
          await task.connectFunction(walletAddress)

          // Generate random reward (1-500 tokens)
          const reward = Math.floor(Math.random() * 500) + 1

          // Update rewards state
          setRewards((prev) => {
            const newRewards = { ...prev, [taskId]: reward }
            const newTotalReward = Object.values(newRewards).reduce((sum, val) => sum + val, 0)
            setTotalReward(newTotalReward)
            return newRewards
          })

          // Close the window if it's still open
          if (socialWindow && !socialWindow.closed) {
            socialWindow.close()
          }

          // Mark task as completed
          setCompleted((prev) => {
            const newCompleted = { ...prev, [taskId]: true }
            return newCompleted
          })

          // Check if all tasks are now completed
          const updatedCompleted = { ...completed, [taskId]: true }
          const allDone = SOCIAL_TASKS.every((t) => updatedCompleted[t.id])

          if (allDone && !allTasksCompleted) {
            // All tasks just completed - update the total token amount in Firebase
            await updateTotalTokenAmount(walletAddress)
            setAllTasksCompleted(true)

            // Notify parent component that all tasks are completed
            if (onAllTasksCompleted) {
              onAllTasksCompleted()
            }
          }

          // Dismiss the loading toast and show success
          toast.dismiss(toastId)
          toast.success(`${task.name} completed! +${reward} tokens`)

          // Call the onConnect callback if this is the Twitter task (for backward compatibility)
          if (taskId === "twitter") {
            onConnect()
          }
        } catch (error) {
          console.error(`Error completing ${task.id} task:`, error)
          toast.dismiss(toastId)
          toast.error(`Failed to complete ${task.name}`)
        } finally {
          setLoading((prev) => ({ ...prev, [taskId]: false }))
        }
      }, task.waitTime)
    } catch (error) {
      console.error(`Error connecting ${task.id}:`, error)
      toast.error(`Failed to connect ${task.name}`)
      setLoading((prev) => ({ ...prev, [taskId]: false }))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.tasksContainer}>
        <h2 className={styles.tasksTitle}>Complete Social Tasks</h2>
        <p className={styles.tasksDescription}>
          Complete all tasks to earn tokens and participate in the WheatChain token spree
        </p>

        <div className={styles.tasksList}>
          {SOCIAL_TASKS.map((task) => (
            <div key={task.id} className={`${styles.taskItem} ${completed[task.id] ? styles.taskCompleted : ""}`}>
              <div className={styles.taskIconContainer}>
                <img src={task.icon || "/placeholder.svg"} alt={task.name} className={styles.taskIcon} />
                {completed[task.id] && (
                  <div className={styles.taskCompletedBadge}>
                    <Check className={styles.taskCompletedIcon} />
                  </div>
                )}
              </div>

              <div className={styles.taskContent}>
                <h3 className={styles.taskName}>{task.name}</h3>
                <p className={styles.taskDescription}>{task.description}</p>

                {completed[task.id] && rewards[task.id] > 0 && (
                  <div className={styles.taskReward}>
                    <span>+{rewards[task.id]} tokens</span>
                  </div>
                )}
              </div>

              <button
                className={`${styles.taskButton} ${completed[task.id] ? styles.taskButtonCompleted : ""}`}
                onClick={() => handleTaskConnect(task.id)}
                disabled={loading[task.id] || completed[task.id] || !walletAddress}
              >
                {loading[task.id] ? (
                  <span className={styles.loadingSpinner}></span>
                ) : completed[task.id] ? (
                  <>
                    <Check className={styles.buttonIcon} />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className={styles.buttonIcon} />
                    <span>{task.id === "twitter" ? "Follow" : "Join"}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {allTasksCompleted && (
          <div className={styles.tasksCompleted}>
            <div className={styles.tasksCompletedIcon}>
              <Check className={styles.checkIcon} />
            </div>
            <h3 className={styles.tasksCompletedTitle}>All Tasks Completed!</h3>
            <p className={styles.tasksCompletedDescription}>
              You've earned {totalReward} bonus tokens. Proceed to claim your rewards.
            </p>
          </div>
        )}

        {!walletAddress && <p className={styles.walletWarning}>Connect your wallet first to complete tasks</p>}
      </div>
    </div>
  )
}
