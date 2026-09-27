import { useState, useEffect } from 'react'
import { mockWaterData } from '../../data/mockData'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import {
  AreaChart,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Bar,
  Cell,
} from 'recharts'
import { Droplets, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stressColor(score: number): string {
  if (score < 25) return '#22c55e'
  if (score < 50) return '#f59e0b'
  if (score < 75) return '#f97316'
  return '#ef4444'
}

function stressLabel(score: number): { label: string; color: string; bg: string } {
  if (score <= 25) return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
  if (score <= 50) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if (score <= 75) return { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.12)' }
  return { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
}

// ─── Custom tooltip for area chart ───────────────────────────────────────────

function WaterTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{ background: '#0d1426', borderColor: 'rgba(30,58,138,0.5)' }}
    >
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value?.toFixed(1)} MLD</span>
        </p>
      ))}
    </div>
  )
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WaterPage() {
  const [summary, setSummary] = useState(mockWaterData.summary)
  const [wardWaterStatus, setWardWaterStatus] = useState(mockWaterData.wardWaterStatus)
  const historical = mockWaterData.historical
  const [modelName, setModelName] = useState('XGBoost Regressor (Water Demand)')

  useEffect(() => {
    fetch('/api/water')
      .then(res => {
        if (!res.ok) throw new Error('API status ' + res.status)
        return res.json()
      })
      .then(data => {
        if (data?.summary) {
          setSummary({
            totalSupply: data.summary.total_supply_mld ?? mockWaterData.summary.totalSupply,
            predictedDemand: data.summary.predicted_demand_mld ?? mockWaterData.summary.predictedDemand,
            deficit: data.summary.deficit_mld ?? mockWaterData.summary.deficit,
            deficitPercent: data.summary.deficit_percent ?? mockWaterData.summary.deficitPercent,
            highStressWards: data.summary.high_stress_wards ?? mockWaterData.summary.highStressWards,
            criticalWards: data.summary.critical_wards ?? mockWaterData.summary.criticalWards,
          })
        }
        if (data?.ward_water_status && Array.isArray(data.ward_water_status) && data.ward_water_status.length > 0) {
          setWardWaterStatus(data.ward_water_status.map((w: any) => ({
            ward: w.ward || w.ward_name,
            supply: w.supply ?? w.supply_mld ?? 0,
            demand: w.demand ?? w.demand_mld ?? 0,
            stress: w.stress ?? w.stress_score ?? 0,
          })))
        }
        if (data?.model) {
          setModelName(data.model)
        }
      })
      .catch(err => {
        console.warn('WaterPage: using mock fallback:', err)
      })
  }, [])

  // Trim historical labels for readability — show every 5th date
  const chartData = historical.map((d, i) => ({
    ...d,
    label: i % 5 === 0 ? d.date : '',
  }))

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Water Intelligence"
        subtitle={`AI-predicted demand vs supply (${modelName}) — thresholds configurable`}
      />

      <main className="flex-1 p-6 space-y-6">
        {/* ── Row 1: Stat Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Droplets size={18} style={{ color: '#60a5fa' }} />}
            label="Total Supply"
            value={`${summary.totalSupply} MLD`}
            sub="Current daily supply"
            color="#60a5fa"
            iconBg="rgba(37,99,235,0.2)"
          />
          <StatCard
            icon={<TrendingUp size={18} style={{ color: '#fb923c' }} />}
            label="Predicted Demand"
            value={`${summary.predictedDemand} MLD`}
            sub="AI-forecast (next 24h)"
            color="#fb923c"
            iconBg="rgba(249,115,22,0.2)"
          />
          <StatCard
            icon={<TrendingDown size={18} style={{ color: '#f87171' }} />}
            label="Deficit"
            value={`${summary.deficit} MLD`}
            sub={`${summary.deficitPercent}% shortfall`}
            color="#f87171"
            iconBg="rgba(239,68,68,0.2)"
          />
          <StatCard
            icon={<AlertTriangle size={18} style={{ color: '#fbbf24' }} />}
            label="High-Risk Wards"
            value={`${summary.highStressWards} wards`}
            sub={`${summary.criticalWards} critical`}
            color="#fbbf24"
            iconBg="rgba(245,158,11,0.2)"
          />
        </div>

        {/* ── Row 2: Charts ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Supply vs Demand Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Supply vs Demand — 30 Days</CardTitle>
              <span className="text-xs text-slate-500">MLD / day</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${Math.round(v)}`}
                  />
                  <Tooltip content={<WaterTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="supply"
                    name="Supply"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#supplyGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="demand"
                    name="Demand"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#demandGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ward Water Stress Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ward Water Stress Scores</CardTitle>
              <span className="text-xs text-slate-500">Score / 100</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={wardWaterStatus}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="ward"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const score = payload[0].value as number
                      const { label: lbl } = stressLabel(score)
                      return (
                        <div
                          className="rounded-lg border px-3 py-2 text-xs shadow-xl"
                          style={{ background: '#0d1426', borderColor: 'rgba(30,58,138,0.5)' }}
                        >
                          <p className="text-slate-300 font-medium mb-0.5">{label}</p>
                          <p style={{ color: stressColor(score) }}>
                            Stress: <strong>{score}</strong> — {lbl}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="stress" name="Stress Score" radius={[4, 4, 0, 0]}>
                    {wardWaterStatus.map((entry) => (
                      <Cell key={entry.ward} fill={stressColor(entry.stress)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Ward Water Status Table ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Ward Water Status</CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle size={12} className="text-green-400" />
              All figures in MLD
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-900/30">
                    {['Ward', 'Supply (MLD)', 'Demand (MLD)', 'Deficit', 'Stress Score', 'Status'].map((h) => (
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
                  {wardWaterStatus.map((row) => {
                    const deficit = row.demand - row.supply
                    const { label, color, bg } = stressLabel(row.stress)
                    return (
                      <tr
                        key={row.ward}
                        className="border-b border-blue-900/20 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pr-4 font-medium text-white">{row.ward}</td>
                        <td className="py-3 pr-4 text-blue-400">{row.supply}</td>
                        <td className="py-3 pr-4 text-orange-400">{row.demand}</td>
                        <td className="py-3 pr-4">
                          <span style={{ color: deficit > 0 ? '#f87171' : '#22c55e' }}>
                            {deficit > 0 ? `−${deficit} MLD` : 'Surplus'}
                          </span>
                        </td>
                        <td className="py-3 pr-6 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${row.stress}%`, background: stressColor(row.stress) }}
                              />
                            </div>
                            <span className="text-xs font-mono w-6 text-slate-400">{row.stress}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ color, background: bg }}
                          >
                            {label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Threshold note */}
            <div
              className="mt-5 rounded-lg px-4 py-3 text-xs text-slate-400 flex items-start gap-2"
              style={{ background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              <Droplets size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Water Stress thresholds:</strong>{' '}
                <span className="text-green-400">0–25 Low</span> |{' '}
                <span className="text-yellow-400">26–50 Moderate</span> |{' '}
                <span className="text-orange-400">51–75 High</span> |{' '}
                <span className="text-red-400">76–100 Critical</span>.{' '}
                These thresholds are configurable in <strong className="text-blue-400">Settings</strong>.
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
