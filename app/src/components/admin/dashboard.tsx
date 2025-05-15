"use client"

import { useState } from "react"
import { getAuth, signOut } from "firebase/auth"
import { AdminSidebar } from "./sidebar"
import { StatisticsOverview } from "./statistics-overview"
import { UsersList } from "./users-list"
import { ReferralsList } from "./referrals-list"
import { Settings } from "./settings"
import { toast } from "react-hot-toast"

interface AdminDashboardProps {
  user: any
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState("overview")
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const auth = getAuth()
      await signOut(auth)
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-layout bg-gray-900 text-white">
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} onSignOut={handleSignOut} user={user} />

      <main className="admin-content overflow-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">
            {activeView === "overview" && "Dashboard Overview"}
            {activeView === "users" && "User Management"}
            {activeView === "referrals" && "Referral Analytics"}
            {activeView === "settings" && "Admin Settings"}
          </h1>

          <div className="flex items-center">
            <span className="mr-4 text-sm text-gray-400">
              Logged in as <span className="text-yellow-500">{user.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {activeView === "overview" && <StatisticsOverview />}
        {activeView === "users" && <UsersList />}
        {activeView === "referrals" && <ReferralsList />}
        {activeView === "settings" && <Settings />}
      </main>
    </div>
  )
}
