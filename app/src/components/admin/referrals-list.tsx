"use client"

import { useState, useEffect } from "react"
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { BarChart, PieChart, Share2 } from "lucide-react"
import { toast } from "react-hot-toast"

interface Referrer {
  id: string
  wallet_address?: string
  referrals_count?: number
  referral_bonus?: number
  referrals_converted?: number
  last_referral_date?: { toDate: () => Date }
}

export function ReferralsList() {
  const [referrals, setReferrals] = useState<Referrer[]>([])
  const [topReferrers, setTopReferrers] = useState<Referrer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalReferrals: 0,
    averageReferralsPerUser: 0,
    totalBonusTokens: 0,
  })

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      const db = getFirestore()

      // Get all users with referrals
      const usersRef = collection(db, "users")
      const usersWithReferralsQuery = query(
        usersRef,
        where("referrals_count", ">", 0),
        orderBy("referrals_count", "desc"),
      )
      const usersSnapshot = await getDocs(usersWithReferralsQuery)

      const referralData: Referrer[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Referrer, "id">),
      }))

      setReferrals(referralData)

      // Get top 5 referrers
      const topReferrersQuery = query(
        usersRef,
        where("referrals_count", ">", 0),
        orderBy("referrals_count", "desc"),
        limit(5),
      )
      const topReferrersSnapshot = await getDocs(topReferrersQuery)

      const topReferrersData: Referrer[] = topReferrersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Referrer, "id">),
      }))

      setTopReferrers(topReferrersData)

      // Calculate stats
      const allUsersSnapshot = await getDocs(usersRef)
      const totalUsers = allUsersSnapshot.size

      let totalReferrals = 0
      let totalBonusTokens = 0

      referralData.forEach((user) => {
        totalReferrals += user.referrals_count || 0
        totalBonusTokens += user.referral_bonus || 0
      })

      setStats({
        totalReferrals,
        averageReferralsPerUser: totalUsers > 0 ? totalReferrals / totalUsers : 0,
        totalBonusTokens,
      })
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-800/50">
              <Share2 size={24} className="text-purple-500" />
            </div>
          </div>
          <div className="stat-value">{stats.totalReferrals.toLocaleString()}</div>
          <div className="stat-label">Total Referrals</div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-800/50">
              <BarChart size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="stat-value">{stats.averageReferralsPerUser.toFixed(2)}</div>
          <div className="stat-label">Avg. Referrals Per User</div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-full bg-gray-800/50">
              <PieChart size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="stat-value">{stats.totalBonusTokens.toLocaleString()}</div>
          <div className="stat-label">Total Bonus Tokens</div>
        </div>
      </div>

      <div className="admin-card mb-8">
        <h2 className="text-xl font-bold mb-6">Top Referrers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topReferrers.length > 0 ? (
            topReferrers.map((referrer, index) => (
              <div key={referrer.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-bold mr-3">
                    {index + 1}
                  </div>
                  <div className="truncate max-w-[200px]">{referrer.wallet_address}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-500">{referrer.referrals_count}</div>
                    <div className="text-sm text-gray-400">Referrals</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{referrer.referral_bonus?.toLocaleString() || 0}</div>
                    <div className="text-sm text-gray-400">Bonus Tokens</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-400">No referral data available</div>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h2 className="text-xl font-bold mb-4">All Referrers</h2>

        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Referrals</th>
                  <th>Bonus Tokens</th>
                  <th>Conversion Rate</th>
                  <th>Last Referral</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referrer) => (
                  <tr key={referrer.id}>
                    <td className="text-gray-300 truncate max-w-[200px]">{referrer.wallet_address}</td>
                    <td>{referrer.referrals_count}</td>
                    <td className="text-yellow-500">{referrer.referral_bonus?.toLocaleString() || 0} $SWHIT</td>
                    <td>
                      {referrer.referrals_count !== undefined && referrer.referrals_count > 0 && referrer.referrals_converted !== undefined
                        ? `${Math.round((referrer.referrals_converted / referrer.referrals_count) * 100)}%`
                        : "0%"}
                    </td>
                    <td className="text-gray-400">
                      {referrer.last_referral_date?.toDate
                        ? referrer.last_referral_date.toDate().toLocaleDateString()
                        : "Never"}
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
    </div>
  )
}
