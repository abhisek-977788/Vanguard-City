import { mockInfrastructure } from '../../data/mockData'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Construction, AlertTriangle, Wrench, CheckCircle, Eye } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function severityConfig(sev: string): { color: string; bg: string; label: string } {
  switch (sev) {
    case 'critical': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical' }
    case 'high':     return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'High' }
    case 'moderate': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Moderate' }
    default:         return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Low' }
  }
}

function detectionTypeLabel(type: string): string {
  switch (type) {
    case 'pothole':     return 'Pothole'
    case 'crack':       return 'Road Crack'
    case 'road_damage': return 'Road Damage'
    default:            return type.replace('_', ' ')
  }
}

function recommendedAction(type: string, severity: string): string {
  if (type === 'pothole' && severity === 'critical') return 'Emergency cold-mix patching within 24h'
  if (type === 'pothole' && severity === 'high')     return 'Schedule hot-mix repair within 72h'
  if (type === 'crack'  && severity === 'moderate')  return 'Apply bituminous crack sealant'
  if (type === 'road_damage')                        return 'Full resurfacing — tender within 2 weeks'
  return 'Inspect on-site and assess repair scope'
}

function priorityConfig(severity: string): { label: string; color: string } {
  switch (severity) {
    case 'critical': return { label: 'P1 — Urgent', color: '#ef4444' }
    case 'high':     return { label: 'P2 — High',   color: '#f97316' }
    case 'moderate': return { label: 'P3 — Medium', color: '#f59e0b' }
    default:         return { label: 'P4 — Low',    color: '#22c55e' }
  }
}

function timeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime()
  const h  = Math.floor(ms / 3600000)
  if (h < 1)  return `${Math.floor(ms / 60000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  iconBg: string
}

function StatCard({ icon, label, value, sub, color, iconBg }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </Card>
  )
}

// ─── Custom donut tooltip ────────────────────────────────────────────────────

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: '#0d1426', borderColor: 'rgba(30,58,138,0.5)' }}
    >
      <p style={{ color: d.payload.color }} className="font-semibold">{d.name}</p>
      <p className="text-slate-300">{d.value} segments</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InfrastructurePage() {
  const { summary, roadConditions, recentDetections } = mockInfrastructure
  const healthColor = summary.infrastructureHealth >= 75 ? '#22c55e'
    : summary.infrastructureHealth >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Infrastructure Monitor"
        subtitle="Road network and asset condition — YOLO11 AI detection results"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* ── Row 1: 5 Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Construction size={18} style={{ color: '#60a5fa' }} />}
            label="Total Road Length"
            value={`${summary.totalRoadLength.toLocaleString()} km`}
            sub="Mapped network"
            color="#60a5fa"
            iconBg="rgba(37,99,235,0.2)"
          />
          <StatCard
            icon={<AlertTriangle size={18} style={{ color: '#f97316' }} />}
            label="Damaged Segments"
            value={String(summary.damagedSegments)}
            sub="Detected by AI"
            color="#f97316"
            iconBg="rgba(249,115,22,0.2)"
          />
          <StatCard
            icon={<AlertTriangle size={18} style={{ color: '#ef4444' }} />}
            label="Critical Segments"
            value={String(summary.criticalSegments)}
            sub="Require urgent repair"
            color="#ef4444"
            iconBg="rgba(239,68,68,0.2)"
          />
          <StatCard
            icon={<Wrench size={18} style={{ color: '#fbbf24' }} />}
            label="Assets for Maintenance"
            value={String(summary.assetsRequiringMaintenance)}
            sub="Scheduled / pending"
            color="#fbbf24"
            iconBg="rgba(245,158,11,0.2)"
          />
          <StatCard
            icon={<CheckCircle size={18} style={{ color: healthColor }} />}
            label="Infrastructure Health"
            value={`${summary.infrastructureHealth}%`}
            sub="Overall network grade"
            color={healthColor}
            iconBg={`rgba(${summary.infrastructureHealth >= 75 ? '34,197,94' : summary.infrastructureHealth >= 50 ? '245,158,11' : '239,68,68'},0.2)`}
          />
        </div>

        {/* ── Row 2: Donut + AI Detection Feed ─────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Donut Chart (40%) */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Road Condition Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={roadConditions}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="condition"
                  >
                    {roadConditions.map((entry) => (
                      <Cell key={entry.condition} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centre label overlay — total segments */}
              <div className="flex justify-center -mt-4 mb-2">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Total segments</p>
                  <p className="text-xl font-bold text-white">
                    {roadConditions.reduce((a, b) => a + b.count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Detection Feed (60%) */}
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>AI Detection Feed</CardTitle>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Eye size={11} /> YOLO11 live
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentDetections.map((det) => {
                  const sev = severityConfig(det.severity)
                  const confPct = Math.round(det.confidence * 100)
                  return (
                    <div
                      key={det.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 border border-blue-900/20 hover:border-blue-900/40 transition-colors"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      {/* Type icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: sev.bg }}
                      >
                        <Construction size={14} style={{ color: sev.color }} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {detectionTypeLabel(det.type)} — {det.location}
                          </span>
                          <span className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(det.detected)}</span>
                        </div>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${confPct}%`, background: sev.color }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 w-10 text-right">{confPct}% conf</span>
                        </div>
                      </div>

                      {/* Severity badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: sev.color, background: sev.bg }}
                      >
                        {sev.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Maintenance Priority Table ────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Priority Queue</CardTitle>
            <span className="text-xs text-slate-500">AI-generated — requires human verification</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-900/30">
                    {['Asset ID', 'Type', 'Location', 'Condition', 'Recommended Action', 'Priority'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 pb-3 pr-4"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentDetections.map((det) => {
                    const sev = severityConfig(det.severity)
                    const pri = priorityConfig(det.severity)
                    const action = recommendedAction(det.type, det.severity)
                    return (
                      <tr
                        key={det.id}
                        className="border-b border-blue-900/20 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pr-4 font-mono text-xs text-blue-400">{det.id}</td>
                        <td className="py-3 pr-4 text-slate-300">{detectionTypeLabel(det.type)}</td>
                        <td className="py-3 pr-4 text-slate-400 text-xs">{det.location}</td>
                        <td className="py-3 pr-4">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: sev.color, background: sev.bg }}
                          >
                            {sev.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400 text-xs max-w-xs">{action}</td>
                        <td className="py-3">
                          <span className="text-xs font-bold" style={{ color: pri.color }}>
                            {pri.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <div
              className="mt-5 rounded-lg px-4 py-3 text-xs text-amber-400/80 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}
            >
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong className="text-amber-300">⚠ Detections are AI-generated.</strong> All recommendations
                require human verification before action. Do not initiate repairs solely based on AI output.
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
