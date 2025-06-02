"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AdminDashboard } from "@/components/admin/dashboard"
import { AdminLogin } from "@/components/admin/login"
import toast from "react-hot-toast"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const supabase = createClientComponentClient()

  // List of authorized admin emails
  const authorizedEmails = ["muizadesope83@gmail.com", "predfi.xyz@gmail.com"]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Check if the user's email is authorized
          if (session.user.email && authorizedEmails.includes(session.user.email)) {
            setUser(session.user)
            setAuthorized(true)
          } else {
            // If not authorized, sign out
            await supabase.auth.signOut()
            setUser(null)
            setAuthorized(false)
            toast.error("Access denied. You are not authorized to access the admin panel.")
          }
        } else {
          setUser(null)
          setAuthorized(false)
        }
      } catch (error) {
        console.error("Auth error:", error)
        setUser(null)
        setAuthorized(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (session.user.email && authorizedEmails.includes(session.user.email)) {
          setUser(session.user)
          setAuthorized(true)
        } else {
          await supabase.auth.signOut()
          setUser(null)
          setAuthorized(false)
          toast.error("Access denied. You are not authorized to access the admin panel.")
        }
      } else {
        setUser(null)
        setAuthorized(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-yellow-500 border-yellow-200/20 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !authorized) {
    return <AdminLogin />
  }

  return <AdminDashboard user={user} />
}
