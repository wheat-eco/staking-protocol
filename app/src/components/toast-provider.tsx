"use client"

import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          background: "rgba(23, 23, 23, 0.9)",
          color: "#fff",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          fontFamily: "var(--font-heading), sans-serif",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#F0B90B",
            secondary: "#FFFFFF",
          },
          style: {
            background: "rgba(16, 185, 129, 0.2)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
          style: {
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          },
        },
      }}
    />
  )
}
