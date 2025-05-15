import { WalletConnection } from "@/components/wallet-connection"
import { MintCard } from "@/components/mint-card"
import { AdminPanel } from "@/components/admin-panel"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <WalletConnection />
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        <MintCard />
        <AdminPanel />
      </div>
    </div>
  )
}
