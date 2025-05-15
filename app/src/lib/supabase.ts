import { createClient } from "@supabase/supabase-js"

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User types
export interface UserData {
  wallet_address: string
  twitter_id?: string
  token_amount?: number
  claimed: boolean
  created_at?: string
}

// Save user data to Supabase
export async function saveUserData(userData: UserData) {
  const { data, error } = await supabase.from("users").upsert(userData, { onConflict: "wallet_address" }).select()

  if (error) {
    console.error("Error saving user data:", error)
    throw error
  }

  return data
}

// Get user data by wallet address
export async function getUserByWallet(walletAddress: string) {
  const { data, error } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user data:", error)
    throw error
  }

  return data
}

// Update user's token amount
export async function updateTokenAmount(walletAddress: string, tokenAmount: number) {
  const { data, error } = await supabase
    .from("users")
    .update({ token_amount: tokenAmount })
    .eq("wallet_address", walletAddress)
    .select()

  if (error) {
    console.error("Error updating token amount:", error)
    throw error
  }

  return data
}

// Mark tokens as claimed
export async function markTokensAsClaimed(walletAddress: string) {
  const { data, error } = await supabase
    .from("users")
    .update({ claimed: true })
    .eq("wallet_address", walletAddress)
    .select()

  if (error) {
    console.error("Error marking tokens as claimed:", error)
    throw error
  }

  return data
}

// Connect social account
export async function connectSocialAccount(walletAddress: string, platform: "twitter", accountId: string) {
  const updateData = { twitter_id: accountId }

  const { data, error } = await supabase.from("users").update(updateData).eq("wallet_address", walletAddress).select()

  if (error) {
    console.error(`Error connecting ${platform} account:`, error)
    throw error
  }

  return data
}

// Create user if not exists
export async function createUserIfNotExists(walletAddress: string) {
  const { data: existingUser } = await supabase.from("users").select("*").eq("wallet_address", walletAddress).single()

  if (!existingUser) {
    const newUser: UserData = {
      wallet_address: walletAddress,
      claimed: false,
    }

    const { data, error } = await supabase.from("users").insert(newUser).select()

    if (error) {
      console.error("Error creating user:", error)
      throw error
    }

    return data[0]
  }

  return existingUser
}
