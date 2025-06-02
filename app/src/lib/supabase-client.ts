import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface UserData {
  id: string
  wallet_address: string
  referral_code: string
  referred_by?: string
  twitter_connected: boolean
  telegram_connected: boolean
  discord_connected: boolean
  base_token_amount: number
  twitter_reward: number
  telegram_reward: number
  discord_reward: number
  referral_bonus: number
  tasks_completed: boolean
  claimed: boolean
  blacklisted: boolean
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
  claimed_at?: string
}

export interface ReferralData {
  id: string
  referrer_id: string
  referee_id: string
  referral_code: string
  referrer_bonus: number
  referee_bonus: number
  processed: boolean
  created_at: string
  processed_at?: string
}

// Create user if not exists
export async function createUserIfNotExists(
  walletAddress: string,
  referralCode?: string,
  clientInfo?: { ip?: string; userAgent?: string },
): Promise<UserData> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()

    if (existingUser) {
      return existingUser
    }

    // Generate unique referral code
    const { data: newReferralCode } = await supabase.rpc("generate_referral_code")

    // Generate base token amount (100-10000 with quadratic bias toward higher values)
    const rand = Math.random()
    const biased = Math.pow(rand, 2)
    const baseAmount = Math.floor(100 + (10000 - 100) * (1 - biased))

    // Add deterministic bonus based on wallet address
    const bonus = walletAddress.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 100

    const finalAmount = baseAmount + bonus

    // Create new user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          wallet_address: walletAddress,
          referral_code: newReferralCode,
          base_token_amount: finalAmount,
          ip_address: clientInfo?.ip,
          user_agent: clientInfo?.userAgent,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Process referral if provided
    if (referralCode && referralCode !== newReferralCode) {
      await processReferral(referralCode, walletAddress)
    }

    // Log user creation
    await supabase.from("activity_log").insert([
      {
        user_id: newUser.id,
        activity_type: "user_created",
        reward_amount: finalAmount,
        metadata: { referral_code: referralCode || null },
      },
    ])

    return newUser
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Get user data
export async function getUserData(walletAddress: string): Promise<UserData | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

// Process referral using database function
export async function processReferral(referralCode: string, refereeWallet: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("process_referral", {
      p_referral_code: referralCode,
      p_referee_wallet: refereeWallet,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error processing referral:", error)
    throw error
  }
}

// Connect social accounts
export async function connectTwitterAccount(walletAddress: string): Promise<number> {
  try {
    const reward = Math.floor(Math.random() * 450) + 50 // 50-500 tokens

    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) throw new Error("User not found")

    const { error } = await supabase
      .from("users")
      .update({
        twitter_connected: true,
        twitter_reward: reward,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)

    if (error) throw error

    // Log activity
    await supabase.from("activity_log").insert([
      {
        user_id: user.id,
        activity_type: "social_task",
        platform: "twitter",
        reward_amount: reward,
      },
    ])

    return reward
  } catch (error) {
    console.error("Error connecting Twitter:", error)
    throw error
  }
}

export async function joinTelegramCommunity(walletAddress: string): Promise<number> {
  try {
    const reward = Math.floor(Math.random() * 450) + 50 // 50-500 tokens

    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) throw new Error("User not found")

    const { error } = await supabase
      .from("users")
      .update({
        telegram_connected: true,
        telegram_reward: reward,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)

    if (error) throw error

    // Log activity
    await supabase.from("activity_log").insert([
      {
        user_id: user.id,
        activity_type: "social_task",
        platform: "telegram",
        reward_amount: reward,
      },
    ])

    return reward
  } catch (error) {
    console.error("Error joining Telegram:", error)
    throw error
  }
}

export async function joinDiscordChannel(walletAddress: string): Promise<number> {
  try {
    const reward = Math.floor(Math.random() * 450) + 50 // 50-500 tokens

    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) throw new Error("User not found")

    const { error } = await supabase
      .from("users")
      .update({
        discord_connected: true,
        discord_reward: reward,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)

    if (error) throw error

    // Log activity
    await supabase.from("activity_log").insert([
      {
        user_id: user.id,
        activity_type: "social_task",
        platform: "discord",
        reward_amount: reward,
      },
    ])

    return reward
  } catch (error) {
    console.error("Error joining Discord:", error)
    throw error
  }
}

// Update tasks completion status
export async function updateTasksCompleted(walletAddress: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        tasks_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)

    if (error) throw error
  } catch (error) {
    console.error("Error updating tasks completion:", error)
    throw error
  }
}

// Get total claimable tokens
export async function getTotalClaimableTokens(walletAddress: string): Promise<number> {
  try {
    const { data } = await supabase.rpc("get_user_stats", {
      p_wallet_address: walletAddress,
    })

    if (data?.success) {
      return data.total_tokens
    }

    return 0
  } catch (error) {
    console.error("Error getting total tokens:", error)
    return 0
  }
}

// Mark tokens as claimed
export async function markTokensAsClaimed(walletAddress: string): Promise<void> {
  try {
    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) throw new Error("User not found")

    const { error } = await supabase
      .from("users")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)

    if (error) throw error

    // Log claim activity
    await supabase.from("activity_log").insert([
      {
        user_id: user.id,
        activity_type: "tokens_claimed",
      },
    ])
  } catch (error) {
    console.error("Error marking tokens as claimed:", error)
    throw error
  }
}

// Get referral stats
export async function getReferralStats(walletAddress: string): Promise<{ count: number; bonus: number }> {
  try {
    const { data } = await supabase.rpc("get_user_stats", {
      p_wallet_address: walletAddress,
    })

    if (data?.success) {
      return {
        count: data.referral_count,
        bonus: data.user.referral_bonus,
      }
    }

    return { count: 0, bonus: 0 }
  } catch (error) {
    console.error("Error getting referral stats:", error)
    return { count: 0, bonus: 0 }
  }
}

// Get user's referral code
export async function getUserReferralCode(walletAddress: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("referral_code")
      .eq("wallet_address", walletAddress)
      .single()

    if (error) throw error
    return data?.referral_code || null
  } catch (error) {
    console.error("Error getting referral code:", error)
    return null
  }
}

// Validate referral code
export async function validateReferralCode(referralCode: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("referral_code", referralCode).single()

    return !error && !!data
  } catch (error) {
    return false
  }
}
