"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { BarChart, Share2, TrendingUp, Users, Gift } from "lucide-react"
import toast from "react-hot-toast"

interface ReferralStats {
  totalReferrals: number
  totalReferrers: number
  totalBonusTokens: number
  averageReferralsPerUser: number
  conversionRate: number
}

interface TopReferrer {
  id: string
  wallet_address: string
  referral_count: number
  total_bonus: number
  latest_referral: string
}

interface ReferralActivity {
  id: string
  referrer_wallet: string
  referee_wallet: string
  referrer_bonus: number
  referee_bonus: number
  created_at: string
}

export function ReferralsList() {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalReferrers: 0,
    totalBonusTokens: 0,
    averageReferralsPerUser: 0,
    conversionRate: 0,
  })
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([])
  const [recentActivity, setRecentActivity] = useState<ReferralActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  useEffect(() => {
    fetchReferralData()
  }, [timeRange])

  const fetchReferralData = async () => {
    try {
      setLoading(true)

      // Get referral statistics
      const { count: totalReferrals } = await supabase.from("referrals").select("*", { count: "exact", head: true })

      const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Get users with referral bonuses
      const { data: usersWithReferrals } = await supabase.from("users").select("referral_bonus").gt("referral_bonus", 0)

      const totalBonusTokens = usersWithReferrals?.reduce((sum, user) => sum + (user.referral_bonus || 0), 0) || 0
      const totalReferrers = usersWithReferrals?.length || 0

      // Get top referrers
      const { data: topReferrersData } = await supabase
        .from("users")
        .select("id, wallet_address, referral_bonus")
        .gt("referral_bonus", 0)
        .order("referral_bonus", { ascending: false })
        .limit(10)

      // Get referral counts for top referrers
      const topReferrersWithCounts = await Promise.all(
        (topReferrersData || []).map(async (user) => {
          const { count } = await supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_id", user.id)

          const { data: latestReferral } = await supabase
            .from("referrals")
            .select("created_at")
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          return {
            id: user.id,
            wallet_address: user.wallet_address,
            referral_count: count || 0,
            total_bonus: user.referral_bonus,
            latest_referral: latestReferral?.created_at || "",
          }
        }),
      )

      // Get recent referral activity
      const timeFilter = new Date()
      if (timeRange === "24h") {
        timeFilter.setHours(timeFilter.getHours() - 24)
      } else if (timeRange === "7d") {
        timeFilter.setDate(timeFilter.getDate() - 7)
      } else {
        timeFilter.setDate(timeFilter.getDate() - 30)
      }

      const { data: recentReferrals } = await supabase
        .from("referrals")
        .select(
          `
          *,
          referrer:referrer_id(wallet_address),
          referee:referee_id(wallet_address)
        `,
        )
        .gte("created_at", timeFilter.toISOString())
        .order("created_at", { ascending: false })
        .limit(20)

      const recentActivityData = (recentReferrals || []).map((referral: any) => ({
        id: referral.id,
        referrer_wallet: referral.referrer?.wallet_address || "Unknown",
        referee_wallet: referral.referee?.wallet_address || "Unknown",
        referrer_bonus: referral.referrer_bonus,
        referee_bonus: referral.referee_bonus,
        created_at: referral.created_at,
      }))

      setStats({
        totalReferrals: totalReferrals || 0,
        totalReferrers,
        totalBonusTokens,
        averageReferralsPerUser: totalReferrers > 0 ? (totalReferrals || 0) / totalReferrers : 0,
        conversionRate: totalUsers ? ((totalReferrals || 0) / totalUsers) * 100 : 0,
      })

      setTopReferrers(topReferrersWithCounts)
      setRecentActivity(recentActivityData)
    } catch (error) {
      console.error("Error fetching referral data:", error)
      toast.error("Failed to load referral data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-t-yellow-500 border-yellow-200/20 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Referral Analytics</h2>
        <div className="flex space-x-2">
          {["24h", "7d", "30d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {range === "24h" ? "24 Hours" : range === "7d" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <Share2 size={24} className="text-purple-500" />
            </div>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalReferrals.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Total Referrals</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <Users size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalReferrers.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Active Referrers</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <Gift size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalBonusTokens.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Bonus Tokens</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <BarChart size={24} className="text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.averageReferralsPerUser.toFixed(1)}</div>
          <div className="text-gray-400 text-sm">Avg. per Referrer</div>
        </div>
      </div>

      {/* Top Referrers and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Referrers */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Top Referrers</h3>
          {topReferrers.length > 0 ? (
            <div className="space-y-4">
              {topReferrers.slice(0, 5).map((referrer, index) => (
                <div key={referrer.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold mr-3 text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm text-gray-300">
                        {referrer.wallet_address.slice(0, 8)}...{referrer.wallet_address.slice(-6)}
                      </div>
                      <div className="text-xs text-gray-400">{referrer.referral_count} referrals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-yellow-500">{referrer.total_bonus.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No referral data available</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Recent Referrals</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Referrer:</span>
                      <span className="ml-1 font-mono text-gray-300">
                        {activity.referrer_wallet.slice(0, 8)}...{activity.referrer_wallet.slice(-6)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-sm mb-2">
                    <span className="text-gray-400">Referee:</span>
                    <span className="ml-1 font-mono text-gray-300">
                      {activity.referee_wallet.slice(0, 8)}...{activity.referee_wallet.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-500">+{activity.referrer_bonus} (referrer)</span>
                    <span className="text-blue-500">+{activity.referee_bonus} (referee)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No recent referral activity</div>
          )}
        </div>
      </div>

      {/* Referral Performance Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-6">Referral Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500 mb-2">{stats.conversionRate.toFixed(1)}%</div>
            <div className="text-gray-400 text-sm">Conversion Rate</div>
            <div className="text-xs text-gray-500 mt-1">Users who were referred</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-2">
              {stats.totalReferrers > 0 ? (stats.totalBonusTokens / stats.totalReferrers).toFixed(0) : 0}
            </div>
            <div className="text-gray-400 text-sm">Avg. Bonus per Referrer</div>
            <div className="text-xs text-gray-500 mt-1">Tokens earned on average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500 mb-2">
              {stats.totalReferrals > 0 ? (stats.totalBonusTokens / stats.totalReferrals).toFixed(0) : 0}
            </div>
            <div className="text-gray-400 text-sm">Bonus per Referral</div>
            <div className="text-xs text-gray-500 mt-1">Average tokens per successful referral</div>
          </div>
        </div>
      </div>
    </div>
  )
}
