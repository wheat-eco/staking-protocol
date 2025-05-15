"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { AdminDashboard } from "@/components/admin/dashboard"
import { AdminLogin } from "@/components/admin/login"
import { initFirebase } from "@/lib/firebase"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Initialize Firebase
    initFirebase()
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
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

  if (!user) {
    return <AdminLogin />
  }

  return <AdminDashboard user={user} />
}
