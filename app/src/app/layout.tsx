import type React from "react"
import { Providers } from "@/components/providers"
import { ToastProvider } from "@/components/toast-provider"
import { Poetsen_One } from "next/font/google"
import "./globals.css"

const poetsenOne = Poetsen_One({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poetsen-one",
})

export const metadata = {
  title: "WheatChain $SWHIT Token Spree",
  description: "The exclusive key to WheatChain's next chapter - Claim your $SWHIT tokens now!",
  keywords: ["WheatChain", "SWHIT", "token", "crypto", "giveaway", "airdrop", "web3", "blockchain", "Sui"],
  authors: [{ name: "WheatChain Team" }],
  openGraph: {
    title: "WheatChain $SWHIT Token Spree | 10 Million Token Giveaway",
    description: "Connect your wallet, link your Twitter, and claim your share of 10 million $SWHIT tokens!",
    images: [{ url: "/og-image.jpg" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WheatChain $SWHIT Token Spree",
    description: "Connect your wallet, link your Twitter, and claim your share of 10 million $SWHIT tokens!",
    images: ["/twitter-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={poetsenOne.variable}>
      <body>
        <Providers>
          <ToastProvider />
          <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
