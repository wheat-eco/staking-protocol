import { initializeApp } from "firebase/app"

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
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

// Firebase configuration
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
const app = initializeApp(firebaseConfig)

const db = getFirestore(app)
const auth = getAuth(app)

// User types
export interface UserData {
  wallet_address: string
  twitter_connected?: boolean
  token_amount?: number
  claimed: boolean
  created_at: Date
  referral_code: string
  referrals_count: number
  referral_bonus: number
}

// Create user if not exists
export async function createUserIfNotExists(walletAddress: string): Promise<UserData> {
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    // Generate a unique referral code
    const referralCode = generateReferralCode(walletAddress)

    const newUser: UserData = {
      wallet_address: walletAddress,
      twitter_connected: false,
      claimed: false,
      created_at: new Date(),
      referral_code: referralCode,
      referrals_count: 0,
      referral_bonus: 0,
    }

    await setDoc(userRef, newUser)
    return newUser
  }

  return userSnap.data() as UserData
}

// Get user data
export async function getUserData(walletAddress: string): Promise<UserData | null> {
  const userRef = doc(db, "users", walletAddress)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return userSnap.data() as UserData
  }

  return null
}

// Connect Twitter account
export async function connectTwitterAccount(walletAddress: string): Promise<void> {
  const userRef = doc(db, "users", walletAddress)

  await updateDoc(userRef, {
    twitter_connected: true,
  })
}

// Generate random token amount
export async function generateTokenAmount(walletAddress: string): Promise<number> {
  // Generate random amount between 100 and 10,000
  const amount = Math.floor(Math.random() * 9900) + 100

  const userRef = doc(db, "users", walletAddress)
  await updateDoc(userRef, {
    token_amount: amount,
  })

  return amount
}

// Mark tokens as claimed
export async function markTokensAsClaimed(walletAddress: string): Promise<void> {
  const userRef = doc(db, "users", walletAddress)

  await updateDoc(userRef, {
    claimed: true,
  })
}

// Process referral
export async function processReferral(referralCode: string, newUserWalletAddress: string): Promise<void> {
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
      referral_bonus: increment(500), // 500 bonus tokens per referral
    })

    // Add bonus to the new user
    const newUserRef = doc(db, "users", newUserWalletAddress)
    const newUserSnap = await getDoc(newUserRef)

    if (newUserSnap.exists()) {
      const userData = newUserSnap.data() as UserData
      const currentTokenAmount = userData.token_amount || 0

      await updateDoc(newUserRef, {
        token_amount: currentTokenAmount + 250, // 250 bonus tokens for being referred
      })
    }
  }
}

// Get referral code
export async function getReferralCode(walletAddress: string): Promise<string> {
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
