"use client"

import { useEffect, useState } from "react"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import { AdminLogin } from "@/components/admin/login"
import { initFirebase } from "@/lib/firebase"
import { toast } from "react-hot-toast"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  // List of authorized admin emails
  const authorizedEmails = ["muizadesope83@gmail.com", "predfi.xyz@gmail.com"]

  useEffect(() => {
    // Initialize Firebase
    initFirebase()
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if the user's email is authorized
        if (user.email && authorizedEmails.includes(user.email)) {
          setUser(user)
          setAuthorized(true)
        } else {
          // If not authorized, sign out
          auth.signOut().then(() => {
            setUser(null)
            setAuthorized(false)
            toast.error("Access denied. You are not authorized to access the admin panel.")
          })
        }
      } else {
        setUser(null)
        setAuthorized(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
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
