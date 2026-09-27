import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Shield, ExternalLink, Menu, X } from 'lucide-react'
import { useState } from 'react'
import CitizenHome from './CitizenHome'
import ReportIssuePage from './ReportIssuePage'
import TrackComplaintPage from './TrackComplaintPage'
import CivicServicesPage from './CivicServicesPage'
import CivicAIPage from './CivicAIPage'

const navLinks = [
  { label: 'Home', to: '/citizen' },
  { label: 'Report Issue', to: '/citizen/report' },
  { label: 'Track Complaint', to: '/citizen/track' },
  { label: 'Civic Services', to: '/citizen/services' },
  { label: 'Ask Civic AI', to: '/citizen/ai' },
]

export default function CitizenPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Navbar ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => navigate('/citizen')}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow group-hover:bg-blue-700 transition-colors">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-blue-700 leading-tight tracking-wide">
                  VANGUARD CITY
                </div>
                <div className="text-[10px] text-slate-500 leading-tight tracking-widest uppercase">
                  Urban Digital Twin
                </div>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.to === '/citizen'
                    ? location.pathname === '/citizen' || location.pathname === '/citizen/'
                    : location.pathname.startsWith(link.to)
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/citizen'}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {link.label}
                  </NavLink>
                )
              })}
            </nav>

            {/* Authority Dashboard Button */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/authority')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Authority Dashboard
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-slate-600 hover:bg-gray-100"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/citizen'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={() => { navigate('/authority'); setMobileOpen(false) }}
              className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Authority Dashboard
            </button>
          </div>
        )}
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1">
        <Routes>
          <Route index element={<CitizenHome />} />
          <Route path="report" element={<ReportIssuePage />} />
          <Route path="track" element={<TrackComplaintPage />} />
          <Route path="services" element={<CivicServicesPage />} />
          <Route path="ai" element={<CivicAIPage />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © 2024 Vanguard City Municipal Corporation · Citizen Services Portal ·{' '}
            <span className="text-blue-600 cursor-pointer hover:underline">Privacy Policy</span>
            {' · '}
            <span className="text-blue-600 cursor-pointer hover:underline">Terms of Use</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
