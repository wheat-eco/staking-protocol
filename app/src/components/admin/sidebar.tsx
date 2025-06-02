"use client"

import { BarChart3, Users, Share2, Settings, LogOut } from "lucide-react"

interface AdminSidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  onSignOut: () => void
  user: any
}

export function AdminSidebar({ activeView, setActiveView, onSignOut, user }: AdminSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "referrals", label: "Referrals", icon: Share2 },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">WheatChain Admin</h2>
        <p className="text-sm text-gray-400 mt-1">Token Campaign Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeView === item.id
                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.email}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={16} className="mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
