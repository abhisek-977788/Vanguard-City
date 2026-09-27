import { Bell, Search, User, RefreshCw } from 'lucide-react'
import { mockAlerts } from '../../data/mockData'
import { useState } from 'react'

interface AuthorityHeaderProps {
  title: string
  subtitle?: string
}

export default function AuthorityHeader({ title, subtitle }: AuthorityHeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false)
  const unreadCount = mockAlerts.filter(a => a.type === 'critical' || a.type === 'high').length

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3 border-b"
      style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(30,58,138,0.25)' }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-64">
        <Search size={14} className="text-slate-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search wards, complaints, assets..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none flex-1"
        />
      </div>

      {/* Refresh */}
      <button
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        title="Refresh data"
      >
        <RefreshCw size={16} />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={() => setShowNotifs(!showNotifs)}
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 text-[10px] bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div
            className="absolute right-0 top-12 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden"
            style={{ background: '#0d1426', borderColor: 'rgba(30,58,138,0.4)' }}
          >
            <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Active Alerts</span>
              <span className="text-xs text-slate-500">{mockAlerts.length} alerts</span>
            </div>
            <div className="max-h-80 overflow-y-auto dark-scroll">
              {mockAlerts.map(alert => (
                <div key={alert.id} className="px-4 py-3 border-b border-blue-900/20 hover:bg-white/5">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.type === 'critical' ? 'bg-red-400' :
                        alert.type === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-medium text-white leading-snug">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 text-center">
              <button className="text-xs text-blue-400 hover:text-blue-300">View all alerts</button>
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 pl-2 border-l border-blue-900/30">
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
        <div className="hidden md:block">
          <div className="text-xs font-medium text-white">Admin</div>
          <div className="text-[10px] text-slate-500">Municipal Authority</div>
        </div>
      </div>
    </header>
  )
}
