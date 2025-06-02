"use client"

import { useState, useEffect } from "react"
import { Check, ExternalLink, Gift } from "lucide-react"
import toast from "react-hot-toast"
import {
  connectTwitterAccount,
  joinTelegramCommunity,
  joinDiscordChannel,
  getUserData,
  updateTasksCompleted,
} from "@/lib/supabase-client"
import styles from "./twitter-connect.module.css"

// Task configuration
const SOCIAL_TASKS = [
  {
    id: "twitter",
    name: "Follow WheatChain on X",
    description: "Follow our official X account to verify your identity",
    icon: "/x-1.png",
    link: "https://x.com/wheatchain_xyz",
    connectFunction: connectTwitterAccount,
    waitTime: 20000, // 20 seconds
    buttonText: "Follow",
  },
  {
    id: "telegram",
    name: "Join Telegram Community",
    description: "Join our Telegram community for updates and discussions",
    icon: "/telegram.png",
    link: "https://t.me/swhit_tgchat",
    connectFunction: joinTelegramCommunity,
    waitTime: 20000, // 20 seconds
    buttonText: "Join",
  },
  {
    id: "discord",
    name: "Join Discord Channel",
    description: "Join our Discord server to connect with the community",
    icon: "/discord.png",
    link: "https://discord.gg/zVsYfGkNDa",
    connectFunction: joinDiscordChannel,
    waitTime: 20000, // 20 seconds
    buttonText: "Join",
  },
]

interface TwitterConnectProps {
  walletAddress?: string
  isConnected: boolean
  onConnect: () => void
  onAllTasksCompleted?: () => void
  onUpdate?: () => void
}

export function TwitterConnect({
  walletAddress,
  isConnected,
  onConnect,
  onAllTasksCompleted,
  onUpdate,
}: TwitterConnectProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [rewards, setRewards] = useState<Record<string, number>>({})
  const [allTasksCompleted, setAllTasksCompleted] = useState(false)
  const [totalReward, setTotalReward] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)

  // Load user data and task completion status on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!walletAddress) {
        setDataLoading(false)
        return
      }

      try {
        setDataLoading(true)
        const userData = await getUserData(walletAddress)

        if (userData) {
          // Initialize completed tasks from user data
          const completedTasks: Record<string, boolean> = {}
          const taskRewards: Record<string, number> = {}
          let socialRewardsTotal = 0

          SOCIAL_TASKS.forEach((task) => {
            const isCompleted = userData[`${task.id}_connected` as keyof typeof userData] === true
            const reward = (userData[`${task.id}_reward` as keyof typeof userData] as number) || 0

            completedTasks[task.id] = isCompleted
            taskRewards[task.id] = reward
            socialRewardsTotal += reward
          })

          setCompleted(completedTasks)
          setRewards(taskRewards)
          setTotalReward(socialRewardsTotal)

          // Check if all tasks are completed
          const allDone = SOCIAL_TASKS.every((task) => completedTasks[task.id])
          setAllTasksCompleted(allDone)

          // If all tasks are completed, notify parent component
          if (allDone && onAllTasksCompleted && !userData.tasks_completed) {
            onAllTasksCompleted()
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        toast.error("Failed to load task data")
      } finally {
        setDataLoading(false)
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
      const socialWindow = window.open(task.link, "_blank", "width=600,height=700")

      // Show loading toast
      const toastId = toast.loading(`Connecting to ${task.name.split(" ").pop()}...`)

      // Wait for user to complete the task
      setTimeout(async () => {
        try {
          // Connect account in Supabase and get reward
          const reward = await task.connectFunction(walletAddress)

          // Close the window if it's still open
          if (socialWindow && !socialWindow.closed) {
            socialWindow.close()
          }

          // Update rewards state
          setRewards((prev) => {
            const newRewards = { ...prev, [taskId]: reward }
            const newTotalReward = Object.values(newRewards).reduce((sum, val) => sum + val, 0)
            setTotalReward(newTotalReward)
            return newRewards
          })

          // Mark task as completed
          setCompleted((prev) => {
            const newCompleted = { ...prev, [taskId]: true }

            // Check if all tasks are now completed
            const allDone = SOCIAL_TASKS.every((t) => newCompleted[t.id])

            if (allDone && !allTasksCompleted) {
              setAllTasksCompleted(true)

              // Update tasks completion status in Supabase
              updateTasksCompleted(walletAddress).catch(console.error)

              // Notify parent component that all tasks are completed
              if (onAllTasksCompleted) {
                onAllTasksCompleted()
              }
            }

            return newCompleted
          })

          // Dismiss the loading toast and show success
          toast.dismiss(toastId)
          toast.success(`${task.name} completed! +${reward} tokens`)

          // Call the onConnect callback if this is the Twitter task (for backward compatibility)
          if (taskId === "twitter") {
            onConnect()
          }

          // Call onUpdate to refresh parent data
          if (onUpdate) {
            onUpdate()
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

  if (dataLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tasksContainer}>
        <h2 className={styles.tasksTitle}>Complete Social Tasks</h2>
        <p className={styles.tasksDescription}>
          Complete all tasks to earn bonus tokens and participate in the WheatChain token spree
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
                    <Gift size={16} />
                    <span>+{rewards[task.id]} tokens earned</span>
                  </div>
                )}
              </div>

              <button
                className={`${styles.taskButton} ${completed[task.id] ? styles.taskButtonCompleted : ""}`}
                onClick={() => handleTaskConnect(task.id)}
                disabled={loading[task.id] || completed[task.id] || !walletAddress}
                title={
                  !walletAddress
                    ? "Connect wallet first"
                    : completed[task.id]
                      ? "Task completed"
                      : `Complete ${task.name}`
                }
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
                    <span>{task.buttonText}</span>
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
              You've earned <strong>{totalReward} bonus tokens</strong> from social tasks. Proceed to claim your total
              rewards.
            </p>
          </div>
        )}

        {!walletAddress && (
          <div className={styles.walletWarning}>
            <p>Connect your wallet first to complete tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}
