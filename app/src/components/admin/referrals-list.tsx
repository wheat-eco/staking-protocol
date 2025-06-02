"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { BarChart, Share2, TrendingUp, Users, Clock, CheckCircle, DollarSign } from "lucide-react"
import toast from "react-hot-toast"

interface ReferralStats {
  totalReferrals: number
  totalReferrers: number
  totalBonusTokens: number
  totalClaimedBonuses: number
  totalUnclaimedBonuses: number
  averageReferralsPerUser: number
  conversionRate: number
  claimRate: number
}

interface TopReferrer {
  id: string
  wallet_address: string
  referral_count: number
  total_bonus: number
  claimed_bonus: number
  unclaimed_bonus: number
  latest_referral: string
}

interface ReferralActivity {
  id: string
  referrer_wallet: string
  referee_wallet: string
  referrer_bonus: number
  referee_bonus: number
  created_at: string
  claimed: boolean
  claimed_at?: string
}

export function ReferralsList() {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalReferrers: 0,
    totalBonusTokens: 0,
    totalClaimedBonuses: 0,
    totalUnclaimedBonuses: 0,
    averageReferralsPerUser: 0,
    conversionRate: 0,
    claimRate: 0,
  })
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([])
  const [recentActivity, setRecentActivity] = useState<ReferralActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    fetchReferralData()
  }, [timeRange])

  const fetchReferralData = async () => {
    try {
      setLoading(true)

      // Get referral statistics
      const { count: totalReferrals } = await supabase.from("referrals").select("*", { count: "exact", head: true })

      const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Get all referrals with claim status
      const { data: allReferrals } = await supabase.from("referrals").select("referrer_bonus, claimed")

      const totalBonusTokens = allReferrals?.reduce((sum, ref) => sum + (ref.referrer_bonus || 0), 0) || 0
      const totalClaimedBonuses =
        allReferrals?.filter((ref) => ref.claimed).reduce((sum, ref) => sum + (ref.referrer_bonus || 0), 0) || 0
      const totalUnclaimedBonuses = totalBonusTokens - totalClaimedBonuses
      const claimRate = totalBonusTokens > 0 ? (totalClaimedBonuses / totalBonusTokens) * 100 : 0

      // Get users with referral bonuses
      const { data: usersWithReferrals } = await supabase.from("users").select("referral_bonus").gt("referral_bonus", 0)

      const totalReferrers = usersWithReferrals?.length || 0

      // Get top referrers with detailed stats
      const { data: topReferrersData } = await supabase
        .from("users")
        .select("id, wallet_address, referral_bonus")
        .gt("referral_bonus", 0)
        .order("referral_bonus", { ascending: false })
        .limit(10)

      // Get referral counts and claim status for top referrers
      const topReferrersWithCounts = await Promise.all(
        (topReferrersData || []).map(async (user) => {
          const { count } = await supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_id", user.id)

          const { data: referralDetails } = await supabase
            .from("referrals")
            .select("referrer_bonus, claimed, created_at")
            .eq("referrer_id", user.id)
            .order("created_at", { ascending: false })

          const claimedBonus =
            referralDetails?.filter((ref) => ref.claimed).reduce((sum, ref) => sum + ref.referrer_bonus, 0) || 0
          const unclaimedBonus =
            referralDetails?.filter((ref) => !ref.claimed).reduce((sum, ref) => sum + ref.referrer_bonus, 0) || 0

          const latestReferral = referralDetails?.[0]?.created_at || ""

          return {
            id: user.id,
            wallet_address: user.wallet_address,
            referral_count: count || 0,
            total_bonus: user.referral_bonus,
            claimed_bonus: claimedBonus,
            unclaimed_bonus: unclaimedBonus,
            latest_referral: latestReferral,
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
        claimed: referral.claimed || false,
        claimed_at: referral.claimed_at,
      }))

      setStats({
        totalReferrals: totalReferrals || 0,
        totalReferrers,
        totalBonusTokens,
        totalClaimedBonuses,
        totalUnclaimedBonuses,
        averageReferralsPerUser: totalReferrers > 0 ? (totalReferrals || 0) / totalReferrers : 0,
        conversionRate: totalUsers ? ((totalReferrals || 0) / totalUsers) * 100 : 0,
        claimRate,
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
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Referral Analytics</h2>
          <p className="text-gray-400">Monitor referral performance and claiming behavior</p>
        </div>
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

      {/* Enhanced Stats Cards */}
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
              <DollarSign size={24} className="text-green-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.totalBonusTokens.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Total Bonus Tokens</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.totalClaimedBonuses.toLocaleString()} claimed • {stats.totalUnclaimedBonuses.toLocaleString()}{" "}
            pending
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <CheckCircle size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.claimRate.toFixed(1)}%</div>
          <div className="text-gray-400 text-sm">Claim Rate</div>
          <div className="text-xs text-gray-500 mt-1">Percentage of bonuses claimed</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-700">
              <BarChart size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{stats.averageReferralsPerUser.toFixed(1)}</div>
          <div className="text-gray-400 text-sm">Avg. per Referrer</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { id: "overview", label: "Overview", icon: BarChart },
          { id: "top-referrers", label: "Top Referrers", icon: Users },
          { id: "recent", label: "Recent Activity", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-yellow-500 text-black" : "text-gray-300 hover:text-white"
            }`}
          >
            <tab.icon size={16} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Claiming Status Overview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-6">Bonus Claiming Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-500 mr-3" />
                  <div>
                    <div className="font-semibold text-green-400">Claimed Bonuses</div>
                    <div className="text-sm text-gray-400">{stats.claimRate.toFixed(1)}% of total</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">{stats.totalClaimedBonuses.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">tokens</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center">
                  <Clock size={20} className="text-yellow-500 mr-3" />
                  <div>
                    <div className="font-semibold text-yellow-400">Pending Bonuses</div>
                    <div className="text-sm text-gray-400">{(100 - stats.claimRate).toFixed(1)}% of total</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.totalUnclaimedBonuses.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">tokens</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-6">Performance Metrics</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-500 mb-2">{stats.conversionRate.toFixed(1)}%</div>
                <div className="text-gray-400 text-sm">Conversion Rate</div>
                <div className="text-xs text-gray-500 mt-1">Users who were referred</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-500 mb-2">
                  {stats.totalReferrers > 0 ? (stats.totalBonusTokens / stats.totalReferrers).toFixed(0) : 0}
                </div>
                <div className="text-gray-400 text-sm">Avg. Bonus per Referrer</div>
                <div className="text-xs text-gray-500 mt-1">Total tokens earned</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-green-500 mb-2">
                  {stats.totalReferrals > 0 ? (stats.totalBonusTokens / stats.totalReferrals).toFixed(0) : 0}
                </div>
                <div className="text-gray-400 text-sm">Bonus per Referral</div>
                <div className="text-xs text-gray-500 mt-1">Average per successful referral</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "top-referrers" && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Top Referrers</h3>
          {topReferrers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Wallet</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Referrals</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Total Bonus</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Claimed</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Pending</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Last Referral</th>
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.slice(0, 10).map((referrer, index) => (
                    <tr key={referrer.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm text-gray-300">
                          {referrer.wallet_address.slice(0, 8)}...{referrer.wallet_address.slice(-6)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">{referrer.referral_count}</td>
                      <td className="py-3 px-4 text-yellow-500 font-semibold">
                        {referrer.total_bonus.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-green-400">{referrer.claimed_bonus.toLocaleString()}</td>
                      <td className="py-3 px-4 text-yellow-400">{referrer.unclaimed_bonus.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {referrer.latest_referral ? new Date(referrer.latest_referral).toLocaleDateString() : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No referral data available</div>
          )}
        </div>
      )}

      {activeTab === "recent" && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-6">Recent Referral Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${activity.claimed ? "bg-green-500" : "bg-yellow-500"}`}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-300">
                          Referrer: {activity.referrer_wallet.slice(0, 8)}...{activity.referrer_wallet.slice(-6)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Referee: {activity.referee_wallet.slice(0, 8)}...{activity.referee_wallet.slice(-6)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          activity.claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {activity.claimed ? "Claimed" : "Pending"}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">+{activity.referrer_bonus} (referrer)</span>
                    <span className="text-blue-400">+{activity.referee_bonus} (referee)</span>
                  </div>
                  {activity.claimed && activity.claimed_at && (
                    <div className="text-xs text-gray-500 mt-2">
                      Claimed: {new Date(activity.claimed_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No recent referral activity</div>
          )}
        </div>
      )}
    </div>
  )
}
