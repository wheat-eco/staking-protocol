import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WheatChain $SWHIT Token Spree | 10 Million Token Giveaway",
  description:
    "Connect your wallet, link your Twitter, and claim your share of 10 million $SWHIT tokens in our exclusive 5-day token spree campaign!",
  keywords: ["WheatChain", "SWHIT", "token", "crypto", "giveaway", "airdrop", "web3", "blockchain", "Sui"],
  authors: [{ name: "WheatChain Team" }],
  openGraph: {
    title: "WheatChain $SWHIT Token Spree | 10 Million Token Giveaway",
    description:
      "Connect your wallet, link your Twitter, and claim your share of 10 million $SWHIT tokens in our exclusive 5-day token spree campaign!",
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
  themeColor: "#F0B90B",
}
