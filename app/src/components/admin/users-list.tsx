"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
} from "firebase/firestore"
import { Search, ChevronLeft, ChevronRight, Check, X, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"

export function UsersList() {
  interface User {
    id: string
    wallet_address: string
    email?: string
    twitter_connected?: boolean
    token_amount?: number
    claimed?: boolean
    referrals_count?: number
    created_at?: any
    blacklisted?: boolean
  }

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (searchValue = "", paginate = false) => {
    try {
      setLoading(true)
      const db = getFirestore()
      const usersRef = collection(db, "users")

      let q
      if (paginate && lastVisible) {
        q = query(usersRef, orderBy("created_at", "desc"), startAfter(lastVisible), limit(pageSize))
      } else {
        q = query(usersRef, orderBy("created_at", "desc"), limit(pageSize))
      }

      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setHasMore(false)
        if (!paginate) {
          setUsers([])
        }
        return
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1]
      setLastVisible(lastDoc)

      const fetchedUsers = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<User, "id">
        return {
          id: doc.id,
          wallet_address: data.wallet_address ?? "",
          email: data.email,
          twitter_connected: data.twitter_connected,
          token_amount: data.token_amount,
          claimed: data.claimed,
          referrals_count: data.referrals_count,
          created_at: data.created_at,
          blacklisted: data.blacklisted,
        }
      })

      if (searchValue) {
        const filteredUsers = fetchedUsers.filter(
          (user) =>
            user.wallet_address.toLowerCase().includes(searchValue.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchValue.toLowerCase())),
        )
        setUsers(filteredUsers)
      } else {
        if (paginate) {
          setUsers((prevUsers) => [...prevUsers, ...fetchedUsers])
        } else {
          setUsers(fetchedUsers)
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(searchTerm)
  }

  const handleNextPage = () => {
    if (hasMore) {
      setPage(page + 1)
      fetchUsers(searchTerm, true)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      // This is a simplified approach - for a real app, you'd need to store previous page results
      setPage(page - 1)
      // For demo purposes, we'll just refetch the first page
      setLastVisible(null)
      fetchUsers(searchTerm)
    }
  }

  const handleToggleBlacklist = async (userId: string, currentStatus: boolean) => {
    try {
      const db = getFirestore()
      const userRef = doc(db, "users", userId)

      await updateDoc(userRef, {
        blacklisted: !currentStatus,
      })

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

  return (
    <div>
      <div className="admin-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold">User Management</h2>
            <p className="text-gray-400 text-sm">View and manage all users participating in the token spree</p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <input
                type="text"
                placeholder="Search by wallet or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white">
                <Search size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                fetchUsers("")
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-r-md"
            >
              Clear
            </button>
          </form>
        </div>

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
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Wallet Address</th>
                    <th>Twitter</th>
                    <th>Token Amount</th>
                    <th>Claimed</th>
                    <th>Referrals</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="text-gray-300">
                        <div className="flex items-center">
                          <span className="truncate max-w-[120px] md:max-w-[200px]">{user.wallet_address}</span>
                          <a
                            href={`https://explorer.sui.io/address/${user.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-gray-400 hover:text-white"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                      <td>
                        {user.twitter_connected ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">Connected</span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-400">
                            Not Connected
                          </span>
                        )}
                      </td>
                      <td className="text-yellow-500">{user.token_amount?.toLocaleString() || "-"} $SWHIT</td>
                      <td>
                        {user.claimed ? (
                          <Check size={18} className="text-green-500" />
                        ) : (
                          <X size={18} className="text-red-500" />
                        )}
                      </td>
                      <td>{user.referrals_count || 0}</td>
                      <td className="text-gray-400">
                        {user.created_at?.toDate
                          ? user.created_at.toDate().toLocaleDateString()
                          : new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleBlacklist(user.id, user.blacklisted || false)}
                            className={`px-2 py-1 text-xs rounded ${
                              user.blacklisted
                                ? "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                                : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            }`}
                          >
                            {user.blacklisted ? "Unblacklist" : "Blacklist"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Showing page {page} {hasMore ? "" : "• End of results"}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
