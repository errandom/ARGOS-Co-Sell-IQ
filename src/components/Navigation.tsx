import type { User } from '@/types'
import { LayoutDashboard, Settings, Search, TrendingUp, LogOut } from 'lucide-react'

interface NavigationProps {
  user: User
  currentView: string
  onNavigate: (view: string) => void
  onSignOut: () => void
}

export function Navigation({
  user,
  currentView,
  onNavigate,
  onSignOut,
}: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan-settings', label: 'Scan Settings', icon: Settings },
    { id: 'detections', label: 'Detections', icon: Search },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-lg font-bold text-[oklch(0.33_0.09_252)] hover:text-[oklch(0.28_0.08_252)] transition-colors"
          >
            ARGOS Co‑Sell IQ
          </button>

          <div className="flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[oklch(0.33_0.09_252)] bg-[oklch(0.93_0.03_245)] rounded-md'
                      : 'text-muted-foreground hover:text-[oklch(0.33_0.09_252)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[oklch(0.42_0.12_248)] rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {user.alias.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm text-[oklch(0.33_0.09_252)] hidden md:inline">{user.name}</span>
            </div>
            <button
              onClick={onSignOut}
              className="text-muted-foreground hover:text-[oklch(0.33_0.09_252)] transition-colors p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
