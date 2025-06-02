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

export interface CampaignSettings {
  token_amounts: { min: number; max: number }
  social_rewards: {
    twitter: { min: number; max: number }
    telegram: { min: number; max: number }
    discord: { min: number; max: number }
  }
  referral_bonuses: { referrer: number; referee: number }
  campaign_duration: { start: string; end: string }
  max_referrals_per_user: number
}

// Cache for settings to avoid repeated database calls
let settingsCache: CampaignSettings | null = null
let settingsCacheTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get campaign settings with caching
export async function getCampaignSettings(): Promise<CampaignSettings> {
  const now = Date.now()

  // Return cached settings if still valid
  if (settingsCache && now - settingsCacheTime < CACHE_DURATION) {
    return settingsCache
  }

  try {
    const { data: settingsData, error } = await supabase.from("campaign_settings").select("setting_key, setting_value")

    if (error) throw error

    // Default settings fallback
    const defaultSettings: CampaignSettings = {
      token_amounts: { min: 100, max: 10000 },
      social_rewards: {
        twitter: { min: 50, max: 500 },
        telegram: { min: 50, max: 500 },
        discord: { min: 50, max: 500 },
      },
      referral_bonuses: { referrer: 500, referee: 250 },
      campaign_duration: { start: "2025-01-01", end: "2025-01-16" },
      max_referrals_per_user: 100,
    }

    if (settingsData && settingsData.length > 0) {
      const settingsMap: Record<string, any> = {}
      settingsData.forEach((setting) => {
        settingsMap[setting.setting_key] = setting.setting_value
      })

      settingsCache = {
        token_amounts: settingsMap.token_amounts || defaultSettings.token_amounts,
        social_rewards: settingsMap.social_rewards || defaultSettings.social_rewards,
        referral_bonuses: settingsMap.referral_bonuses || defaultSettings.referral_bonuses,
        campaign_duration: settingsMap.campaign_duration || defaultSettings.campaign_duration,
        max_referrals_per_user: settingsMap.max_referrals_per_user || defaultSettings.max_referrals_per_user,
      }
    } else {
      settingsCache = defaultSettings
    }

    settingsCacheTime = now
    return settingsCache
  } catch (error) {
    console.error("Error fetching campaign settings:", error)

    // Return default settings on error
    const defaultSettings: CampaignSettings = {
      token_amounts: { min: 100, max: 10000 },
      social_rewards: {
        twitter: { min: 50, max: 500 },
        telegram: { min: 50, max: 500 },
        discord: { min: 50, max: 500 },
      },
      referral_bonuses: { referrer: 500, referee: 250 },
      campaign_duration: { start: "2025-01-01", end: "2025-01-16" },
      max_referrals_per_user: 100,
    }

    return defaultSettings
  }
}

// Clear settings cache (useful after admin updates)
export function clearSettingsCache() {
  settingsCache = null
  settingsCacheTime = 0
}

// Safe upsert function for campaign settings
export async function upsertCampaignSetting(key: string, value: any): Promise<void> {
  try {
    // Use the database function for safe upsert
    const { error } = await supabase.rpc("upsert_campaign_setting", {
      p_setting_key: key,
      p_setting_value: value,
    })

    if (error) throw error

    // Clear cache after successful update
    clearSettingsCache()
  } catch (error) {
    console.error(`Error upserting setting ${key}:`, error)
    throw error
  }
}

// Generate token amount based on settings
export async function generateTokenAmount(): Promise<number> {
  try {
    const settings = await getCampaignSettings()
    const { min, max } = settings.token_amounts

    // Generate with quadratic bias toward higher values
    const rand = Math.random()
    const biased = Math.pow(rand, 2)
    const baseAmount = Math.floor(min + (max - min) * (1 - biased))

    return baseAmount
  } catch (error) {
    console.error("Error generating token amount:", error)
    // Fallback to default range
    const rand = Math.random()
    const biased = Math.pow(rand, 2)
    return Math.floor(100 + (10000 - 100) * (1 - biased))
  }
}

// Generate social reward based on settings
export async function generateSocialReward(platform: "twitter" | "telegram" | "discord"): Promise<number> {
  try {
    const settings = await getCampaignSettings()
    const { min, max } = settings.social_rewards[platform]

    return Math.floor(Math.random() * (max - min + 1)) + min
  } catch (error) {
    console.error(`Error generating ${platform} reward:`, error)
    // Fallback to default range
    return Math.floor(Math.random() * 450) + 50
  }
}

// Create user if not exists with dynamic settings
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

    // Generate base token amount using settings
    const baseAmount = await generateTokenAmount()

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

// Connect social accounts with dynamic rewards
export async function connectTwitterAccount(walletAddress: string): Promise<number> {
  try {
    const reward = await generateSocialReward("twitter")

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
    const reward = await generateSocialReward("telegram")

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
    const reward = await generateSocialReward("discord")

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

// Check if campaign is active
export async function isCampaignActive(): Promise<boolean> {
  try {
    const settings = await getCampaignSettings()
    const now = new Date()
    const startDate = new Date(settings.campaign_duration.start)
    const endDate = new Date(settings.campaign_duration.end + "T23:59:59Z")

    return now >= startDate && now <= endDate
  } catch (error) {
    console.error("Error checking campaign status:", error)
    return true // Default to active on error
  }
}

// Get detailed referral earnings for a user
export async function getReferralEarnings(walletAddress: string): Promise<{
  earnings: Array<{
    id: string
    referrer_bonus: number
    referee_wallet: string
    created_at: string
    claimed: boolean
  }>
  totalUnclaimed: number
  totalClaimed: number
}> {
  try {
    // Get user ID first
    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) {
      return { earnings: [], totalUnclaimed: 0, totalClaimed: 0 }
    }

    // Get all referral records for this user
    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(`
        id,
        referrer_bonus,
        referee_bonus,
        created_at,
        claimed,
        referee:referee_id(wallet_address)
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const earnings = (referrals || []).map((referral: any) => ({
      id: referral.id,
      referrer_bonus: referral.referrer_bonus,
      referee_wallet: referral.referee?.wallet_address || "Unknown",
      created_at: referral.created_at,
      claimed: referral.claimed || false,
    }))

    const totalUnclaimed = earnings
      .filter((earning) => !earning.claimed)
      .reduce((sum, earning) => sum + earning.referrer_bonus, 0)

    const totalClaimed = earnings
      .filter((earning) => earning.claimed)
      .reduce((sum, earning) => sum + earning.referrer_bonus, 0)

    return {
      earnings,
      totalUnclaimed,
      totalClaimed,
    }
  } catch (error) {
    console.error("Error fetching referral earnings:", error)
    return { earnings: [], totalUnclaimed: 0, totalClaimed: 0 }
  }
}

// Mark referral bonuses as claimed
export async function markReferralBonusAsClaimed(walletAddress: string): Promise<void> {
  try {
    // Get user ID
    const { data: user } = await supabase.from("users").select("id").eq("wallet_address", walletAddress).single()

    if (!user) throw new Error("User not found")

    // Mark all unclaimed referrals as claimed
    const { error } = await supabase
      .from("referrals")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq("referrer_id", user.id)
      .eq("claimed", false)

    if (error) throw error

    // Log the claim activity
    await supabase.from("activity_log").insert([
      {
        user_id: user.id,
        activity_type: "referral_bonuses_claimed",
      },
    ])
  } catch (error) {
    console.error("Error marking referral bonuses as claimed:", error)
    throw error
  }
}
