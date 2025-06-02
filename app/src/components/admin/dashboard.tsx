"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AdminSidebar } from "./sidebar"
import { StatisticsOverview } from "./statistics-overview"
import { UsersList } from "./users-list"
import { ReferralsList } from "./referrals-list"
import { Settings } from "./settings"
import toast from "react-hot-toast"

interface AdminDashboardProps {
  user: any
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState("overview")
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
      toast.error("Failed to sign out")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <AdminSidebar activeView={activeView} setActiveView={setActiveView} onSignOut={handleSignOut} user={user} />

      <main className="flex-1 ml-64 p-8 overflow-auto">
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>

        <div className="max-w-full">
          {activeView === "overview" && <StatisticsOverview />}
          {activeView === "users" && <UsersList />}
          {activeView === "referrals" && <ReferralsList />}
          {activeView === "settings" && <Settings />}
        </div>
      </main>
    </div>
  )
}
