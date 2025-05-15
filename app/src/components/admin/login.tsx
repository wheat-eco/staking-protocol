"use client"

import { useState } from "react"
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { initFirebase } from "@/lib/firebase"
import { toast } from "react-hot-toast"
import Image from "next/image"

export function AdminLogin() {
  const [loading, setLoading] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  // Initialize Firebase
  initFirebase()
  const auth = getAuth()

  // List of authorized admin emails
  const authorizedEmails = ["muizadesope83@gmail.com", "predfi.xyz@gmail.com"]

  const handleGoogleLogin = async () => {
    setLoading(true)
    setAccessDenied(false)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Check if the user's email is in the authorized list
      if (result.user && result.user.email && authorizedEmails.includes(result.user.email)) {
        toast.success("Login successful!")
      } else {
        // If not authorized, sign out and show access denied
        await auth.signOut()
        setAccessDenied(true)
        toast.error("Access denied. You are not authorized to access the admin panel.")
      }
    } catch (error: any) {
      console.error("Google login error:", error)
      toast.error(error.message || "Failed to login with Google")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/placeholder.svg?height=80&width=80" alt="WheatChain Logo" width={80} height={80} />
          </div>
          <h2 className="text-3xl font-bold text-white">WheatChain Admin</h2>
          <p className="mt-2 text-gray-400">Sign in to access the admin dashboard</p>
        </div>

        {accessDenied ? (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-md">
            <h3 className="text-lg font-medium text-red-400">Access Denied</h3>
            <p className="mt-2 text-gray-300">
              You are not authorized to access the admin panel. Please contact an administrator if you believe this is
              an error.
            </p>
            <button
              onClick={() => setAccessDenied(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 space-x-4 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              )}
              <span>{loading ? "Signing in..." : "Sign in with Google"}</span>
            </button>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Only authorized administrators can access this panel.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
