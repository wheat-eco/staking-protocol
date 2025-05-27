import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  increment,
  Timestamp,
} from "firebase/firestore"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyAGQMk7e_CdD4t7Kbr1Gif3LGyiAYCZIP0",
  authDomain: "wher-faccd.firebaseapp.com",
  projectId: "wher-faccd",
  storageBucket: "wher-faccd.firebasestorage.app",
  messagingSenderId: "221341040286",
  appId: "1:221341040286:web:ca960e81dd6a060787058f",
  measurementId: "G-8HQSTBFR8G"
};

// Initialize Firebase
export const initFirebase = () => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig)
  }
  return getApps()[0]
}

// User types
export interface UserData {
  wallet_address: string
  twitter_connected?: boolean
  telegram_connected?: boolean
  discord_connected?: boolean
  twitter_reward?: number
  telegram_reward?: number
  discord_reward?: number
  token_amount?: number
  social_rewards_total?: number
  claimed: boolean
  created_at: Date | Timestamp
  referral_code: string
  referrals_count: number
  referral_bonus: number
  blacklisted?: boolean
  [key: string]: any // Allow for dynamic properties
}

// Create user if not exists
export async function createUserIfNotExists(walletAddress: string): Promise<UserData> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    // Generate a unique referral code
    const referralCode = generateReferralCode(walletAddress)

    const newUser: UserData = {
      wallet_address: walletAddress,
      twitter_connected: false,
      telegram_connected: false,
      discord_connected: false,
      claimed: false,
      created_at: Timestamp.now(),
      referral_code: referralCode,
      referrals_count: 0,
      referral_bonus: 0,
    }

    await setDoc(userRef, newUser)

    // Generate initial token amount for the new user
    await generateTokenAmount(walletAddress)

    return newUser
  }

  return userSnap.data() as UserData
}

// Get user data
export async function getUserData(walletAddress: string): Promise<UserData | null> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return userSnap.data() as UserData
  }

  return null
}

// Connect Twitter account
export async function connectTwitterAccount(walletAddress: string): Promise<void> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)

  // Generate random reward (1-500 tokens)
  const reward = Math.floor(Math.random() * 500) + 1

  await updateDoc(userRef, {
    twitter_connected: true,
    twitter_reward: reward,
    twitter_connected_at: Timestamp.now(),
  })

  // Log the activity
  const activityRef = doc(collection(db, "activity"))
  await setDoc(activityRef, {
    type: "social_task",
    platform: "twitter",
    wallet_address: walletAddress,
    reward: reward,
    timestamp: Timestamp.now(),
  })
}

// Join Telegram community
export async function joinTelegramCommunity(walletAddress: string): Promise<void> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)

  // Generate random reward (1-500 tokens)
  const reward = Math.floor(Math.random() * 500) + 1

  await updateDoc(userRef, {
    telegram_connected: true,
    telegram_reward: reward,
    telegram_connected_at: Timestamp.now(),
  })

  // Log the activity
  const activityRef = doc(collection(db, "activity"))
  await setDoc(activityRef, {
    type: "social_task",
    platform: "telegram",
    wallet_address: walletAddress,
    reward: reward,
    timestamp: Timestamp.now(),
  })
}

// Join Discord channel
export async function joinDiscordChannel(walletAddress: string): Promise<void> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)

  // Generate random reward (1-500 tokens)
  const reward = Math.floor(Math.random() * 500) + 1

  await updateDoc(userRef, {
    discord_connected: true,
    discord_reward: reward,
    discord_connected_at: Timestamp.now(),
  })

  // Log the activity
  const activityRef = doc(collection(db, "activity"))
  await setDoc(activityRef, {
    type: "social_task",
    platform: "discord",
    wallet_address: walletAddress,
    reward: reward,
    timestamp: Timestamp.now(),
  })
}

// Generate token amount
export async function generateTokenAmount(walletAddress: string): Promise<number> {
  const app = initFirebase()
  const db = getFirestore(app)

  // Get campaign settings
  const settingsRef = doc(db, "settings", "campaign")
  const settingsSnap = await getDoc(settingsRef)

  let minAmount = 100
  let maxAmount = 10000

  if (settingsSnap.exists()) {
    const settings = settingsSnap.data()
    minAmount = settings.minTokenAmount || minAmount
    maxAmount = settings.maxTokenAmount || maxAmount
  }

  // Quadratic bias towards higher values
  const rand = Math.random()
  const biased = Math.pow(rand, 2) // 0..1, more weight toward 0 (lower values)
  const amount = Math.floor(minAmount + (maxAmount - minAmount) * (1 - biased))

  // Add a small deterministic bonus based on wallet address hash
  let bonus = 0
  if (walletAddress) {
    // Simple hash: sum char codes mod 100
    bonus = walletAddress
      .split("")
      .reduce((sum, c) => sum + c.charCodeAt(0), 0) % 100
  }

  const finalAmount = amount + bonus

  const userRef = doc(db, "users", walletAddress)
  await updateDoc(userRef, {
    token_amount: finalAmount,
  })

  return finalAmount
}

// Update total token amount (base + social rewards)
export async function updateTotalTokenAmount(walletAddress: string): Promise<number> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User not found")
  }

  const userData = userSnap.data() as UserData

  // Calculate total social rewards
  const twitterReward = userData.twitter_reward || 0
  const telegramReward = userData.telegram_reward || 0
  const discordReward = userData.discord_reward || 0
  const socialRewards = twitterReward + telegramReward + discordReward

  // Update the social_rewards_total field
  await updateDoc(userRef, {
    social_rewards_total: socialRewards,
    tasks_completed: true,
  })

  return socialRewards
}

// Get total claimable tokens
export async function getTotalClaimableTokens(walletAddress: string): Promise<number> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    throw new Error("User not found")
  }

  const userData = userSnap.data() as UserData

  // Get base token amount
  const baseTokenAmount = userData.token_amount || 0

  // Get social rewards
  const twitterReward = userData.twitter_reward || 0
  const telegramReward = userData.telegram_reward || 0
  const discordReward = userData.discord_reward || 0
  const socialRewards = twitterReward + telegramReward + discordReward

  // Get referral bonus
  const referralBonus = userData.referral_bonus || 0

  // Calculate total
  const totalTokens = baseTokenAmount + socialRewards + referralBonus

  return totalTokens
}

// Mark tokens as claimed
export async function markTokensAsClaimed(walletAddress: string): Promise<void> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)

  await updateDoc(userRef, {
    claimed: true,
    claimed_at: Timestamp.now(),
  })

  // Log the claim in activity
  const activityRef = doc(collection(db, "activity"))
  await setDoc(activityRef, {
    type: "claim",
    wallet_address: walletAddress,
    timestamp: Timestamp.now(),
  })
}

// Process referral
export async function processReferral(referralCode: string, newUserWalletAddress: string): Promise<void> {
  const app = initFirebase()
  const db = getFirestore(app)

  // Get campaign settings
  const settingsRef = doc(db, "settings", "campaign")
  const settingsSnap = await getDoc(settingsRef)

  let referrerBonus = 500
  let refereeBonus = 250

  if (settingsSnap.exists()) {
    const settings = settingsSnap.data()
    referrerBonus = settings.referralBonus || referrerBonus
    refereeBonus = settings.refereeBonus || refereeBonus
  }

  // Find the referrer
  const usersRef = collection(db, "users")
  const q = query(usersRef, where("referral_code", "==", referralCode))
  const querySnapshot = await getDocs(q)

  if (!querySnapshot.empty) {
    const referrerDoc = querySnapshot.docs[0]
    const referrerWalletAddress = referrerDoc.id

    // Update referrer's stats
    const referrerRef = doc(db, "users", referrerWalletAddress)
    await updateDoc(referrerRef, {
      referrals_count: increment(1),
      referral_bonus: increment(referrerBonus),
      last_referral_date: Timestamp.now(),
    })

    // Add bonus to the new user
    const newUserRef = doc(db, "users", newUserWalletAddress)
    const newUserSnap = await getDoc(newUserRef)

    if (newUserSnap.exists()) {
      const userData = newUserSnap.data() as UserData
      const currentTokenAmount = userData.token_amount || 0

      await updateDoc(newUserRef, {
        token_amount: currentTokenAmount + refereeBonus,
        referred_by: referrerWalletAddress,
      })
    }

    // Log the referral in activity
    const activityRef = doc(collection(db, "activity"))
    await setDoc(activityRef, {
      type: "referral",
      referrer: referrerWalletAddress,
      referee: newUserWalletAddress,
      bonus: referrerBonus,
      timestamp: Timestamp.now(),
    })
  }
}

// Get referral code
export async function getReferralCode(walletAddress: string): Promise<string> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserData
    return userData.referral_code
  }

  // If no referral code exists, generate one
  const referralCode = generateReferralCode(walletAddress)
  await updateDoc(userRef, {
    referral_code: referralCode,
  })

  return referralCode
}

// Get referral stats
export async function getReferralStats(walletAddress: string): Promise<{ count: number; bonus: number }> {
  const app = initFirebase()
  const db = getFirestore(app)
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    const userData = userSnap.data() as UserData
    return {
      count: userData.referrals_count || 0,
      bonus: userData.referral_bonus || 0,
    }
  }

  return { count: 0, bonus: 0 }
}

// Helper function to generate a referral code
function generateReferralCode(walletAddress: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  // Use first 4 chars of wallet address
  const prefix = walletAddress.substring(2, 6).toUpperCase()

  // Add 6 random chars
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return `${prefix}${code}`
}
