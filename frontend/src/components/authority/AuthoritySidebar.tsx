import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, Droplets, Building2, Zap,
  HardHat, MessageSquare, Brain, FileText, Settings,
  Shield, ChevronRight, ExternalLink,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { mockOverviewStats } from '../../data/mockData'

const navItems = [
  { to: '/authority', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/authority/risk-map', label: 'Risk Map', icon: Map },
  { to: '/authority/water', label: 'Water Intelligence', icon: Droplets },
  { to: '/authority/infrastructure', label: 'Infrastructure', icon: Building2 },
  { to: '/authority/power', label: 'Power Network', icon: Zap },
  { to: '/authority/construction', label: 'Construction Monitor', icon: HardHat },
  { to: '/authority/complaints', label: 'Citizen Complaints', icon: MessageSquare },
  { to: '/authority/insights', label: 'AI Insights', icon: Brain },
  { to: '/authority/reports', label: 'Reports', icon: FileText },
  { to: '/authority/settings', label: 'Settings', icon: Settings },
]

export default function AuthoritySidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[260px] flex flex-col dark-scroll overflow-y-auto z-30"
      style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1426 100%)', borderRight: '1px solid rgba(30,58,138,0.3)' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide leading-tight">VANGUARD CITY</div>
            <div className="text-blue-400 text-[10px] tracking-widest uppercase">Urban Digital Twin</div>
          </div>
        </div>
      </div>

      {/* Live status bar */}
      <div className="px-4 py-3 border-b border-blue-900/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot inline-block" />
            <span className="text-green-400 font-medium">System Live</span>
          </div>
          <span className="text-slate-500">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="bg-red-500/10 rounded px-2 py-1 border border-red-500/20">
            <div className="text-red-400 text-xs font-bold">{mockOverviewStats.activeAlerts}</div>
            <div className="text-slate-500 text-[10px]">Active Alerts</div>
          </div>
          <div className="bg-blue-500/10 rounded px-2 py-1 border border-blue-500/20">
            <div className="text-blue-400 text-xs font-bold">{mockOverviewStats.openComplaints}</div>
            <div className="text-slate-500 text-[10px]">Open Issues</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 pb-2">
          Command Center
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r" />
                )}
                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-blue-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — switch to citizen portal */}
      <div className="px-4 py-4 border-t border-blue-900/30">
        <a
          href="/citizen"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={12} />
          Switch to Citizen Portal
        </a>
        <div className="mt-3 text-[10px] text-slate-700">
          ⚠ AI recommendations only. Not official decisions.
        </div>
      </div>
    </aside>
  )
}
