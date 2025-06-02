"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import { Search, ChevronLeft, ChevronRight, Check, X, ExternalLink, Ban, Shield } from "lucide-react"
import toast from "react-hot-toast"

interface User {
  id: string
  wallet_address: string
  twitter_connected: boolean
  telegram_connected: boolean
  discord_connected: boolean
  base_token_amount: number
  twitter_reward: number
  telegram_reward: number
  discord_reward: number
  referral_bonus: number
  claimed: boolean
  blacklisted: boolean
  created_at: string
  referred_by?: string
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [filter, setFilter] = useState("all")
  const pageSize = 20

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filter])

  const fetchUsers = async (search = "") => {
    try {
      setLoading(true)

      let query = supabase.from("users").select("*", { count: "exact" })

      // Apply filters
      if (filter === "claimed") {
        query = query.eq("claimed", true)
      } else if (filter === "unclaimed") {
        query = query.eq("claimed", false)
      } else if (filter === "blacklisted") {
        query = query.eq("blacklisted", true)
      } else if (filter === "referred") {
        query = query.not("referred_by", "is", null)
      }

      // Apply search
      if (search) {
        query = query.ilike("wallet_address", `%${search}%`)
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to)

      if (error) throw error

      setUsers(data || [])
      setTotalUsers(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers(searchTerm)
  }

  const handleToggleBlacklist = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ blacklisted: !currentStatus }).eq("id", userId)

      if (error) throw error

      // Update local state
      setUsers(
        users.map((user) => {
          if (user.id === userId) {
            return { ...user, blacklisted: !currentStatus }
          }
          return user
        }),
      )

      toast.success(`User ${currentStatus ? "removed from" : "added to"} blacklist`)
    } catch (error) {
      console.error("Error updating blacklist status:", error)
      toast.error("Failed to update blacklist status")
    }
  }

  const getTotalTokens = (user: User) => {
    return (
      user.base_token_amount + user.twitter_reward + user.telegram_reward + user.discord_reward + user.referral_bonus
    )
  }

  const getSocialConnections = (user: User) => {
    const connections = []
    if (user.twitter_connected) connections.push("Twitter")
    if (user.telegram_connected) connections.push("Telegram")
    if (user.discord_connected) connections.push("Discord")
    return connections
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">User Management</h2>
            <p className="text-gray-400 text-sm">
              {totalUsers.toLocaleString()} total users • Page {currentPage} of {totalPages}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">All Users</option>
              <option value="claimed">Claimed Tokens</option>
              <option value="unclaimed">Unclaimed Tokens</option>
              <option value="referred">Referred Users</option>
              <option value="blacklisted">Blacklisted</option>
            </select>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search wallet address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-64"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-r-lg transition-colors"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-t-yellow-500 border-yellow-200/20 rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Wallet Address</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Social</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Total Tokens</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Referrals</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="text-gray-300 font-mono text-sm">
                            {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-6)}
                          </span>
                          <a
                            href={`https://explorer.sui.io/address/${user.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-gray-400 hover:text-white"
                          >
                            <ExternalLink size={14} />
                          </a>
                          {user.blacklisted && <Ban size={14} className="ml-2 text-red-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {getSocialConnections(user).map((platform) => (
                            <span
                              key={platform}
                              className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500"
                            >
                              {platform.charAt(0)}
                            </span>
                          ))}
                          {getSocialConnections(user).length === 0 && (
                            <span className="text-gray-500 text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-yellow-500 font-semibold">{getTotalTokens(user).toLocaleString()}</div>
                        <div className="text-xs text-gray-400">
                          Base: {user.base_token_amount.toLocaleString()} • Bonus:{" "}
                          {(
                            user.twitter_reward +
                            user.telegram_reward +
                            user.discord_reward +
                            user.referral_bonus
                          ).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.claimed ? (
                            <span className="flex items-center px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                              <Check size={12} className="mr-1" />
                              Claimed
                            </span>
                          ) : (
                            <span className="flex items-center px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-400">
                              <X size={12} className="mr-1" />
                              Pending
                            </span>
                          )}
                          {user.referred_by && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500">
                              Referred
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-500 font-semibold">+{user.referral_bonus.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleBlacklist(user.id, user.blacklisted)}
                          className={`flex items-center px-3 py-1 text-xs rounded-lg transition-colors ${
                            user.blacklisted
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          }`}
                        >
                          {user.blacklisted ? (
                            <>
                              <Shield size={12} className="mr-1" />
                              Unban
                            </>
                          ) : (
                            <>
                              <Ban size={12} className="mr-1" />
                              Ban
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalUsers)} of{" "}
                {totalUsers} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-4 py-2 bg-gray-700 rounded-md">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
