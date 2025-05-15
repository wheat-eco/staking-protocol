import type React from "react"
import { Providers } from "@/components/providers"
import { ToastProvider } from "@/components/toast-provider"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "WheatChain TGE Pass",
  description: "The exclusive key to WheatChain's next chapter",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider />
          <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
