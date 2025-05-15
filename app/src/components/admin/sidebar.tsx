"use client"

import { BarChart3, Users, Share2, Settings, LogOut } from "lucide-react"
import Image from "next/image"

interface AdminSidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  onSignOut: () => void
  user: any
}

export function AdminSidebar({ activeView, setActiveView, onSignOut, user }: AdminSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: <BarChart3 size={20} /> },
    { id: "users", label: "Users", icon: <Users size={20} /> },
    { id: "referrals", label: "Referrals", icon: <Share2 size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ]

  return (
    <aside className="admin-sidebar">
      <div className="flex items-center mb-8">
        <Image src="/placeholder.svg?height=40&width=40" alt="WheatChain Logo" width={40} height={40} />
        <h1 className="ml-3 text-xl font-bold text-white">WheatChain Admin</h1>
      </div>

      <div className="mb-6">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === item.id
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={onSignOut}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
