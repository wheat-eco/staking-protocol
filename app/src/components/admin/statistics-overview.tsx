"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { ArrowUpRight, Users, Twitter, Coins, Share2 } from "lucide-react"
import toast from "react-hot-toast"

interface ActivityItem {
  id: string
  user_id: string
  activity_type: string
  platform?: string
  reward_amount: number
  created_at: string
  metadata?: any
  users?: {
    wallet_address: string
  }
}

export function StatisticsOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    twitterConnected: 0,
    telegramConnected: 0,
    discordConnected: 0,
    tokensClaimed: 0,
    totalReferrals: 0,
    totalTokensDistributed: 0,
    totalReferralBonuses: 0,
    averageTokensPerUser: 0,
    claimRate: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("24h")

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Get total users
      const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Get social connections
      const { count: twitterConnected } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("twitter_connected", true)

      const { count: telegramConnected } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("telegram_connected", true)

      const { count: discordConnected } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("discord_connected", true)

      // Get claimed tokens
      const { count: tokensClaimed } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("claimed", true)

      // Get total referrals
      const { count: totalReferrals } = await supabase.from("referrals").select("*", { count: "exact", head: true })

      // Get token distribution data
      const { data: claimedUsers } = await supabase
        .from("users")
        .select("base_token_amount, twitter_reward, telegram_reward, discord_reward, referral_bonus")
        .eq("claimed", true)

      let totalTokensDistributed = 0
      let totalReferralBonuses = 0

      if (claimedUsers) {
        claimedUsers.forEach((user) => {
          const userTotal =
            (user.base_token_amount || 0) +
            (user.twitter_reward || 0) +
            (user.telegram_reward || 0) +
            (user.discord_reward || 0) +
            (user.referral_bonus || 0)
          totalTokensDistributed += userTotal
          totalReferralBonuses += user.referral_bonus || 0
        })
      }

      const safeTokensClaimed = tokensClaimed ?? 0
      const averageTokensPerUser = safeTokensClaimed ? totalTokensDistributed / safeTokensClaimed : 0
      const claimRate = totalUsers ? (safeTokensClaimed / totalUsers) * 100 : 0

      setStats({
        totalUsers: totalUsers || 0,
        twitterConnected: twitterConnected || 0,
        telegramConnected: telegramConnected || 0,
        discordConnected: discordConnected || 0,
        tokensClaimed: tokensClaimed || 0,
        totalReferrals: totalReferrals || 0,
        totalTokensDistributed,
        totalReferralBonuses,
        averageTokensPerUser,
        claimRate,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const timeFilter = new Date()
      if (timeRange === "24h") {
        timeFilter.setHours(timeFilter.getHours() - 24)
      } else if (timeRange === "7d") {
        timeFilter.setDate(timeFilter.getDate() - 7)
      } else {
        timeFilter.setDate(timeFilter.getDate() - 30)
      }

      const { data: activities } = await supabase
        .from("activity_log")
        .select(
          `
          *,
          users (wallet_address)
        `,
        )
        .gte("created_at", timeFilter.toISOString())
        .order("created_at", { ascending: false })
        .limit(10)

      setRecentActivity(activities || [])
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  const getActivityLabel = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case "user_created":
        return "User Registered"
      case "social_task":
        return `${activity.platform?.charAt(0).toUpperCase()}${activity.platform?.slice(1)} Connected`
      case "tokens_claimed":
        return "Tokens Claimed"
      case "referral_bonus":
        return "Referral Bonus"
      case "referred_bonus":
        return "Referred Bonus"
      default:
        return activity.activity_type
    }
  }

  const getActivityColor = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case "user_created":
        return "bg-blue-500/10 text-blue-500"
      case "social_task":
        return "bg-purple-500/10 text-purple-500"
      case "tokens_claimed":
        return "bg-green-500/10 text-green-500"
      case "referral_bonus":
      case "referred_bonus":
        return "bg-yellow-500/10 text-yellow-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users size={24} className="text-blue-500" />,
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Social Connections",
      value: stats.twitterConnected + stats.telegramConnected + stats.discordConnected,
      icon: <Twitter size={24} className="text-blue-400" />,
      change: `${stats.totalUsers ? Math.round(((stats.twitterConnected + stats.telegramConnected + stats.discordConnected) / (stats.totalUsers * 3)) * 100) : 0}%`,
      changeType: "neutral" as const,
    },
    {
      title: "Tokens Claimed",
      value: stats.tokensClaimed,
      icon: <Coins size={24} className="text-yellow-500" />,
      change: `${Math.round(stats.claimRate)}%`,
      changeType: "neutral" as const,
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals,
      icon: <Share2 size={24} className="text-green-500" />,
      change: "+15%",
      changeType: "positive" as const,
    },
  ]

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
        <h2 className="text-2xl font-bold">Campaign Analytics</h2>
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
        {statCards.map((stat, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-full bg-gray-700">{stat.icon}</div>
              <div
                className={`flex items-center text-sm ${
                  stat.changeType === "positive"
                    ? "text-green-500"
                    : "text-gray-400"
                }`}
              >
                {stat.change}
                {stat.changeType !== "neutral" && <ArrowUpRight size={16} className="ml-1" />}
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Token Distribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Token Distribution</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Distributed</span>
              <span className="text-2xl font-bold text-yellow-500">
                {stats.totalTokensDistributed.toLocaleString()} $SWHIT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average Per User</span>
              <span className="text-lg font-semibold">{Math.round(stats.averageTokensPerUser).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Referral Bonuses</span>
              <span className="text-lg font-semibold text-green-500">
                {stats.totalReferralBonuses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Claim Rate</span>
              <span className="text-lg font-semibold">{Math.round(stats.claimRate)}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Campaign Progress</span>
              <span>{Math.min(100, Math.round((stats.totalTokensDistributed / 10000000) * 100))}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((stats.totalTokensDistributed / 10000000) * 100))}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {stats.totalTokensDistributed.toLocaleString()} / 10,000,000 tokens distributed
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Social Platform Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span>Twitter</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{stats.twitterConnected}</div>
                <div className="text-sm text-gray-400">
                  {stats.totalUsers ? Math.round((stats.twitterConnected / stats.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                <span>Telegram</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{stats.telegramConnected}</div>
                <div className="text-sm text-gray-400">
                  {stats.totalUsers ? Math.round((stats.telegramConnected / stats.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span>Discord</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{stats.discordConnected}</div>
                <div className="text-sm text-gray-400">
                  {stats.totalUsers ? Math.round((stats.discordConnected / stats.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Reward</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="border-b border-gray-700/50">
                    <td className="py-3 px-4 text-gray-300">
                      {activity.users?.wallet_address
                        ? `${activity.users.wallet_address.slice(0, 6)}...${activity.users.wallet_address.slice(-4)}`
                        : "Unknown"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getActivityColor(activity)}`}>
                        {getActivityLabel(activity)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-yellow-500">
                      {activity.reward_amount > 0 ? `+${activity.reward_amount.toLocaleString()} $SWHIT` : "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(activity.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No recent activity</div>
        )}
      </div>
    </div>
  )
}
