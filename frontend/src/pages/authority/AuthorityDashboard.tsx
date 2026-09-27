import { Routes, Route } from 'react-router-dom'
import AuthoritySidebar from '../../components/authority/AuthoritySidebar'
import OverviewPage from './OverviewPage'
import RiskMapPage from './RiskMapPage'
import WaterPage from './WaterPage'
import InfrastructurePage from './InfrastructurePage'
import PowerPage from './PowerPage'
import ConstructionPage from './ConstructionPage'
import ComplaintsPage from './ComplaintsPage'
import InsightsPage from './InsightsPage'
import ReportsPage from './ReportsPage'
import SettingsPage from './SettingsPage'

export default function AuthorityDashboard() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0a0f1e' }}
    >
      {/* Fixed left sidebar */}
      <AuthoritySidebar />

      {/* Main scrollable content — offset by sidebar width */}
      <main
        className="flex-1 ml-[260px] min-h-screen flex flex-col overflow-x-hidden"
        style={{ background: '#0a0f1e' }}
      >
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="risk-map" element={<RiskMapPage />} />
          <Route path="water" element={<WaterPage />} />
          <Route path="infrastructure" element={<InfrastructurePage />} />
          <Route path="power" element={<PowerPage />} />
          <Route path="construction" element={<ConstructionPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
