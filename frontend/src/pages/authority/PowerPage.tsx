import { mockPowerData } from '../../data/mockData'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Zap, AlertTriangle, CloudLightning, Thermometer, Wind, Droplets } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherRisk {
  label: string
  value: string
  unit: string
  level: 'low' | 'moderate' | 'high' | 'critical'
  icon: React.ReactNode
  note: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function conditionConfig(cond: string): { color: string; bg: string; label: string } {
  switch (cond) {
    case 'critical': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical' }
    case 'poor':     return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Poor' }
    case 'fair':     return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Fair' }
    case 'good':     return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'Good' }
    default:         return { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: cond }
  }
}

function vulnerabilityColor(score: number): string {
  if (score >= 80) return '#ef4444'
  if (score >= 60) return '#f97316'
  if (score >= 40) return '#f59e0b'
  return '#22c55e'
}

function riskLevelConfig(level: WeatherRisk['level']): { color: string; bg: string } {
  switch (level) {
    case 'critical': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
    case 'high':     return { color: '#f97316', bg: 'rgba(249,115,22,0.12)' }
    case 'moderate': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
    default:         return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
  }
}

function riskLabel(level: WeatherRisk['level']): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
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

// ─── Weather Risk Gauge Card ──────────────────────────────────────────────────

function WeatherRiskCard({ item }: { item: WeatherRisk }) {
  const cfg = riskLevelConfig(item.level)
  const gaugePercent =
    item.level === 'critical' ? 95 :
    item.level === 'high'     ? 72 :
    item.level === 'moderate' ? 48 : 22

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: cfg.bg }}
          >
            {item.icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, background: cfg.bg }}
        >
          {riskLabel(item.level)}
        </span>
      </div>

      {/* Big value */}
      <div className="text-center">
        <span className="text-3xl font-bold" style={{ color: cfg.color }}>{item.value}</span>
        <span className="text-sm text-slate-500 ml-1">{item.unit}</span>
      </div>

      {/* Gauge bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-600 mb-1">
          <span>Low</span>
          <span>Critical</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${gaugePercent}%`,
              background: `linear-gradient(to right, #22c55e, ${cfg.color})`,
            }}
          />
        </div>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">{item.note}</p>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PowerPage() {
  const { summary, assets } = mockPowerData

  const stormRiskColor =
    summary.stormRisk === 'critical' ? '#ef4444' :
    summary.stormRisk === 'high'     ? '#f97316' :
    summary.stormRisk === 'moderate' ? '#f59e0b' : '#22c55e'

  const weatherRisks: WeatherRisk[] = [
    {
      label: 'Wind Speed',
      value: '58',
      unit: 'km/h',
      level: 'moderate',
      icon: <Wind size={14} style={{ color: '#f59e0b' }} />,
      note: 'Gusting to 72 km/h in coastal wards. Overhead lines at elevated risk of contact.',
    },
    {
      label: 'Rainfall',
      value: '112',
      unit: 'mm/24h',
      level: 'high',
      icon: <Droplets size={14} style={{ color: '#f97316' }} />,
      note: 'Heavy rainfall forecast increasing ground saturation risk for buried cable infrastructure.',
    },
    {
      label: 'Cyclone Proximity',
      value: '380',
      unit: 'km',
      level: 'moderate',
      icon: <CloudLightning size={14} style={{ color: '#f59e0b' }} />,
      note: 'BOB Depression moving NNW. Landfall not expected within 48h — continue monitoring.',
    },
    {
      label: 'Flood Risk',
      value: '3.2',
      unit: 'm above MSL',
      level: 'high',
      icon: <Thermometer size={14} style={{ color: '#f97316' }} />,
      note: '8 substations are below projected flood level. Sandbag protection deployment advised.',
    },
  ]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Power Network"
        subtitle="Utility infrastructure vulnerability and weather exposure analysis"
      />

      <main className="flex-1 p-6 space-y-6">
        {/* ── Row 1: 5 Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Zap size={18} style={{ color: '#60a5fa' }} />}
            label="Total Assets"
            value={String(summary.totalAssets)}
            sub="Network infrastructure"
            color="#60a5fa"
            iconBg="rgba(37,99,235,0.2)"
          />
          <StatCard
            icon={<AlertTriangle size={18} style={{ color: '#ef4444' }} />}
            label="Vulnerable Assets"
            value={String(summary.vulnerableAssets)}
            sub="Score ≥ 70 / 100"
            color="#ef4444"
            iconBg="rgba(239,68,68,0.2)"
          />
          <StatCard
            icon={<CloudLightning size={18} style={{ color: '#f97316' }} />}
            label="Weather Exposed"
            value={String(summary.weatherExposedAssets)}
            sub="In storm exposure zone"
            color="#f97316"
            iconBg="rgba(249,115,22,0.2)"
          />
          <StatCard
            icon={<Wind size={18} style={{ color: stormRiskColor }} />}
            label="Storm Risk"
            value={summary.stormRisk.charAt(0).toUpperCase() + summary.stormRisk.slice(1)}
            sub="Current forecast level"
            color={stormRiskColor}
            iconBg={`rgba(${summary.stormRisk === 'moderate' ? '245,158,11' : '239,68,68'},0.2)`}
          />
          <StatCard
            icon={<Zap size={18} style={{ color: '#ef4444' }} />}
            label="Critical Nodes"
            value={String(summary.criticalNodes)}
            sub="Single-point-of-failure"
            color="#ef4444"
            iconBg="rgba(239,68,68,0.2)"
          />
        </div>

        {/* ── Row 2: Power Assets Table ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Power Asset Vulnerability Assessment</CardTitle>
            <span className="text-xs text-slate-500">Ranked by vulnerability score</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-900/30">
                    {['Asset ID', 'Type', 'Location', 'Condition', 'Vulnerability Score', 'Risk Level'].map((h) => (
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
                  {[...assets].sort((a, b) => b.vulnerability - a.vulnerability).map((asset) => {
                    const cond = conditionConfig(asset.condition)
                    const vColor = vulnerabilityColor(asset.vulnerability)
                    const riskLabel =
                      asset.vulnerability >= 80 ? { label: 'Critical', color: '#ef4444' } :
                      asset.vulnerability >= 60 ? { label: 'High',     color: '#f97316' } :
                      asset.vulnerability >= 40 ? { label: 'Moderate', color: '#f59e0b' } :
                                                  { label: 'Low',      color: '#22c55e' }

                    return (
                      <tr
                        key={asset.id}
                        className="border-b border-blue-900/20 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pr-4 font-mono text-xs text-blue-400">{asset.id}</td>
                        <td className="py-3 pr-4 text-slate-300 font-medium">{asset.type}</td>
                        <td className="py-3 pr-4 text-slate-400 text-xs">{asset.location}</td>
                        <td className="py-3 pr-4">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: cond.color, background: cond.bg }}
                          >
                            {cond.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${asset.vulnerability}%`, background: vColor }}
                              />
                            </div>
                            <span className="text-xs font-mono w-6 text-slate-400">{asset.vulnerability}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-xs font-bold" style={{ color: riskLabel.color }}>
                            {riskLabel.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Row 3: Weather Risk Panel ─────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CloudLightning size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Weather Risk Indicators
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
              style={{ color: stormRiskColor, background: `${stormRiskColor}1a` }}
            >
              Overall: {summary.stormRisk.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {weatherRisks.map((item) => (
              <WeatherRiskCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* Storm preparedness advisory */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                <AlertTriangle size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Storm Preparedness Advisory</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Based on current weather data and asset vulnerability scores,{' '}
                  <strong className="text-amber-300">8 priority assets</strong> require pre-storm inspection.
                  Power assets in Ward 5 (PWR-001), Ward 7 (PWR-004), and Ward 14 (PWR-003) have the highest
                  combined weather-vulnerability risk score. Coordination with the State Electricity Board is
                  recommended before the forecast landfall window.
                </p>
                <div className="flex items-center gap-4 mt-3 text-[11px]">
                  <span className="text-slate-500">Last updated: 10:00 AM IST, 27 Sep 2026</span>
                  <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    View full report →
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
