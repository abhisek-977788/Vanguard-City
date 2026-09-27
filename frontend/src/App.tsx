import { Routes, Route, Navigate } from 'react-router-dom'
import AuthorityDashboard from './pages/authority/AuthorityDashboard'
import CitizenPortal from './pages/citizen/CitizenPortal'

export default function App() {
  return (
    <Routes>
      {/* Authority Dashboard */}
      <Route path="/authority/*" element={<AuthorityDashboard />} />
      {/* Citizen Portal */}
      <Route path="/citizen/*" element={<CitizenPortal />} />
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/authority" replace />} />
      <Route path="*" element={<Navigate to="/authority" replace />} />
    </Routes>
  )
}
