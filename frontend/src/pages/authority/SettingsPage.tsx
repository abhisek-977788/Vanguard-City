import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Bell, Shield, Database, Brain, Sliders, Save } from 'lucide-react'
import { useState } from 'react'

interface ThresholdSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}

function ThresholdSlider({ label, value, onChange, color }: ThresholdSliderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-xs text-slate-400">{label}</div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
      <div className="w-10 text-xs font-mono font-bold text-right" style={{ color }}>{value}</div>
    </div>
  )
}

export default function SettingsPage() {
  const [waterThresholds, setWaterThresholds] = useState({ low: 25, moderate: 50, high: 75 })
  const [riskThresholds, setRiskThresholds] = useState({ low: 25, moderate: 50, high: 75 })
  const [alertSettings, setAlertSettings] = useState({
    emailAlerts: true, smsAlerts: false, criticalOnly: false
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex-1 overflow-y-auto dark-scroll" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader title="Settings" subtitle="Platform configuration — thresholds, alerts, and system preferences" />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* Water Stress Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-blue-400" />
              <CardTitle>Water Stress Thresholds</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-4">
              These thresholds determine how water stress scores are classified. Adjusting these affects dashboard displays and alert triggers.
            </p>
            <div className="space-y-4">
              <ThresholdSlider label="Low / Moderate boundary" value={waterThresholds.low} onChange={v => setWaterThresholds(p => ({ ...p, low: Math.min(v, p.moderate - 5) }))} color="#22c55e" />
              <ThresholdSlider label="Moderate / High boundary" value={waterThresholds.moderate} onChange={v => setWaterThresholds(p => ({ ...p, moderate: Math.max(p.low + 5, Math.min(v, p.high - 5)) }))} color="#f59e0b" />
              <ThresholdSlider label="High / Critical boundary" value={waterThresholds.high} onChange={v => setWaterThresholds(p => ({ ...p, high: Math.max(p.moderate + 5, v) }))} color="#ef4444" />
            </div>
            <div className="mt-4 flex gap-2">
              {[
                { label: `Low: 0–${waterThresholds.low}`, color: 'bg-green-500/20 text-green-400' },
                { label: `Moderate: ${waterThresholds.low + 1}–${waterThresholds.moderate}`, color: 'bg-yellow-500/20 text-yellow-400' },
                { label: `High: ${waterThresholds.moderate + 1}–${waterThresholds.high}`, color: 'bg-orange-500/20 text-orange-400' },
                { label: `Critical: ${waterThresholds.high + 1}–100`, color: 'bg-red-500/20 text-red-400' },
              ].map(item => (
                <span key={item.label} className={`px-2 py-1 rounded text-xs ${item.color}`}>{item.label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Thresholds */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-purple-400" />
              <CardTitle>AI Risk Score Thresholds</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 mb-4">
              Classification thresholds for the AI-generated composite risk scores.
            </p>
            <div className="space-y-4">
              <ThresholdSlider label="Low / Moderate" value={riskThresholds.low} onChange={v => setRiskThresholds(p => ({ ...p, low: Math.min(v, p.moderate - 5) }))} color="#22c55e" />
              <ThresholdSlider label="Moderate / High" value={riskThresholds.moderate} onChange={v => setRiskThresholds(p => ({ ...p, moderate: Math.max(p.low + 5, Math.min(v, p.high - 5)) }))} color="#f59e0b" />
              <ThresholdSlider label="High / Critical" value={riskThresholds.high} onChange={v => setRiskThresholds(p => ({ ...p, high: Math.max(p.moderate + 5, v) }))} color="#ef4444" />
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-yellow-400" />
              <CardTitle>Alert Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Send alerts to registered email addresses' },
                { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Send SMS for critical alerts only' },
                { key: 'criticalOnly', label: 'Critical Alerts Only', desc: 'Only trigger alerts for Critical-level events' },
              ].map(setting => (
                <div key={setting.key} className="flex items-start justify-between gap-4 py-3 border-b border-blue-900/20 last:border-0">
                  <div>
                    <div className="text-sm text-white">{setting.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{setting.desc}</div>
                  </div>
                  <button
                    onClick={() => setAlertSettings(p => ({ ...p, [setting.key]: !p[setting.key as keyof typeof p] }))}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      alertSettings[setting.key as keyof typeof alertSettings] ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        alertSettings[setting.key as keyof typeof alertSettings] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database size={16} className="text-green-400" />
              <CardTitle>System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {[
                { label: 'Frontend', value: 'React 18 + Vite + TypeScript' },
                { label: 'Backend', value: 'FastAPI (Phase 3 — pending)' },
                { label: 'Database', value: 'PostgreSQL + PostGIS (Phase 4 — pending)' },
                { label: 'CV Model', value: 'YOLO11 (Phase 6 — pending)' },
                { label: 'Water Model', value: 'XGBoost (Phase 8 — pending)' },
                { label: 'Risk Engine', value: 'XGBoost Ensemble (Phase 12 — pending)' },
                { label: 'GIS', value: 'OSM + GeoPandas (Phase 5 — pending)' },
                { label: 'AI Assistant', value: 'RAG + Gemini (Phase 14 — pending)' },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-0.5 p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-red-400" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-yellow-400">
                <span>⚠</span>
                <span>JWT authentication and role-based access control will be implemented in Phase 19 (Security).</span>
              </div>
              <div>Currently running in development mode with no authentication. Do not expose this to the public internet without implementing Phase 19 security measures.</div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} className="gap-2">
            <Save size={14} />
            {saved ? '✓ Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
