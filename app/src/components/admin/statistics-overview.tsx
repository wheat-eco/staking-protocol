"use client"

import { useState, useEffect } from "react"
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore"
import { ArrowUpRight, Users, Twitter, Coins, Share2 } from "lucide-react"

export function StatisticsOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    twitterConnected: 0,
    tokensClaimed: 0,
    totalReferrals: 0,
    totalTokensDistributed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const db = getFirestore()

        // Get all users
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        const totalUsers = usersSnapshot.size

        // Count users with Twitter connected
        const twitterConnectedQuery = query(usersRef, where("twitter_connected", "==", true))
        const twitterConnectedSnapshot = await getDocs(twitterConnectedQuery)
        const twitterConnected = twitterConnectedSnapshot.size

        // Count users who claimed tokens
        const tokensClaimedQuery = query(usersRef, where("claimed", "==", true))
        const tokensClaimedSnapshot = await getDocs(tokensClaimedQuery)
        const tokensClaimed = tokensClaimedSnapshot.size

        // Calculate total tokens distributed
        let totalTokensDistributed = 0
        tokensClaimedSnapshot.forEach((doc) => {
          const userData = doc.data()
          totalTokensDistributed += userData.token_amount || 0
        })

        // Calculate total referrals
        let totalReferrals = 0
        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          totalReferrals += userData.referrals_count || 0
        })

        setStats({
          totalUsers,
          twitterConnected,
          tokensClaimed,
          totalReferrals,
          totalTokensDistributed,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users size={24} className="text-blue-500" />,
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Twitter Connected",
      value: stats.twitterConnected,
      icon: <Twitter size={24} className="text-blue-400" />,
      change: `${stats.totalUsers ? Math.round((stats.twitterConnected / stats.totalUsers) * 100) : 0}%`,
      changeType: "neutral",
    },
    {
      title: "Tokens Claimed",
      value: stats.tokensClaimed,
      icon: <Coins size={24} className="text-yellow-500" />,
      change: `${stats.totalUsers ? Math.round((stats.tokensClaimed / stats.totalUsers) * 100) : 0}%`,
      changeType: "neutral",
    },
    {
      title: "Total Referrals",
      value: stats.totalReferrals,
      icon: <Share2 size={24} className="text-green-500" />,
      change: "+5%",
      changeType: "positive",
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-full bg-gray-800/50">{stat.icon}</div>
              <div
                className={`flex items-center text-sm ${
                  stat.changeType === "positive"
                    ? "text-green-500"
                    : stat.changeType === "negative"
                      ? "text-red-500"
                      : "text-gray-400"
                }`}
              >
                {stat.change}
                {stat.changeType !== "neutral" && <ArrowUpRight size={16} className="ml-1" />}
              </div>
            </div>
            <div className="stat-value">{stat.value.toLocaleString()}</div>
            <div className="stat-label">{stat.title}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2 className="text-xl font-bold mb-4">Token Distribution</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Total Tokens Distributed</h3>
              <div className="text-4xl font-bold text-yellow-500">
                {stats.totalTokensDistributed.toLocaleString()} $SWHIT
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Average Per User</div>
                <div className="text-xl font-semibold">
                  {stats.tokensClaimed
                    ? Math.round(stats.totalTokensDistributed / stats.tokensClaimed).toLocaleString()
                    : 0}{" "}
                  $SWHIT
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Claim Rate</div>
                <div className="text-xl font-semibold">
                  {stats.totalUsers ? Math.round((stats.tokensClaimed / stats.totalUsers) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-4">Distribution Progress</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-500 bg-yellow-500/10">
                    {stats.totalTokensDistributed.toLocaleString()} / 10,000,000
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-yellow-500">
                    {Math.min(100, Math.round((stats.totalTokensDistributed / 10000000) * 100))}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div
                  style={{
                    width: `${Math.min(100, Math.round((stats.totalTokensDistributed / 10000000) * 100))}%`,
                  }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-gray-300">0x1a2b...3c4d</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Claimed Tokens</span>
                </td>
                <td className="text-yellow-500">5,432 $SWHIT</td>
                <td className="text-gray-400">2 minutes ago</td>
              </tr>
              <tr>
                <td className="text-gray-300">0x5e6f...7g8h</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">Connected Twitter</span>
                </td>
                <td>-</td>
                <td className="text-gray-400">15 minutes ago</td>
              </tr>
              <tr>
                <td className="text-gray-300">0x9i0j...1k2l</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500">
                    Referral Bonus
                  </span>
                </td>
                <td className="text-yellow-500">500 $SWHIT</td>
                <td className="text-gray-400">32 minutes ago</td>
              </tr>
              <tr>
                <td className="text-gray-300">0x3m4n...5o6p</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Claimed Tokens</span>
                </td>
                <td className="text-yellow-500">7,891 $SWHIT</td>
                <td className="text-gray-400">1 hour ago</td>
              </tr>
              <tr>
                <td className="text-gray-300">0x7q8r...9s0t</td>
                <td>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">Claimed Tokens</span>
                </td>
                <td className="text-yellow-500">2,345 $SWHIT</td>
                <td className="text-gray-400">2 hours ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
