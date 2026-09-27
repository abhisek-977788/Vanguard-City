import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  MessageSquare,
  Droplets,
  Construction,
  Zap,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Brain,
  Activity,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import {
  mockOverviewStats,
  mockAlerts,
  mockWards,
  mockComplaints,
  mockAiInsights,
  mockDashboardTrend,
  mockInfrastructure,
} from '../../data/mockData'
import { getRiskLabel, timeAgo } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accentColor: string          // Tailwind class like 'text-red-400'
  bgColor: string              // Tailwind class like 'bg-red-500/10'
  borderColor: string          // Tailwind class like 'border-red-500/20'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(13,20,38,0.9)',
  border: '1px solid rgba(30,58,138,0.3)',
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'high':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    case 'moderate':
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    default:
      return 'bg-green-500/20 text-green-400 border border-green-500/30'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return { cls: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: Circle }
    case 'in_progress':
      return { cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: Activity }
    case 'under_review':
      return { cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: AlertCircle }
    case 'resolved':
      return { cls: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: CheckCircle2 }
    default:
      return { cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30', icon: Minus }
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'road': return Construction
    case 'water': return Droplets
    case 'electricity': return Zap
    case 'drainage': return Droplets
    case 'construction': return Building2
    default: return MessageSquare
  }
}

function getAlertAccent(type: string) {
  switch (type) {
    case 'critical': return { dot: 'bg-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400' }
    case 'high': return { dot: 'bg-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400' }
    default: return { dot: 'bg-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-400' }
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, trend, trendLabel, accentColor, bgColor, borderColor }: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-slate-500'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={CARD_STYLE}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor} border ${borderColor}`}>
          <Icon size={18} className={accentColor} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </div>
      <div>
        <div className={`text-2xl font-bold ${accentColor}`}>{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#0d1426', border: '1px solid rgba(30,58,138,0.5)' }}>
      <div className="text-slate-400 mb-1 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Ward Risk Leaderboard ────────────────────────────────────────────────────

function WardRiskLeaderboard() {
  const [wards, setWards] = useState<any[]>(mockWards)

  useEffect(() => {
    fetch('/api/wards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((w: any) => ({
            id: `W-${w.ward_number || w.id}`,
            name: w.name,
            riskScore: Math.round(w.risk_score || w.base_risk_score || 50),
            population: w.population || 50000,
          }))
          setWards(formatted)
        }
      })
      .catch(err => console.log('Wards API fallback notice:', err))
  }, [])

  const topWards = [...wards]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)

  return (
    <div className="rounded-xl p-5 h-full flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Highest Risk Wards</div>
          <div className="text-xs text-slate-500 mt-0.5">Top 5 by AI risk score (Live PostGIS DB)</div>
        </div>
        <MapPin size={16} className="text-blue-400" />
      </div>

      <div className="flex-1 space-y-3">
        {topWards.map((ward, idx) => {
          const riskColor =
            ward.riskScore >= 76 ? '#ef4444'
            : ward.riskScore >= 51 ? '#f97316'
            : ward.riskScore >= 26 ? '#f59e0b'
            : '#22c55e'

          return (
            <div key={ward.id} className="flex items-center gap-3 group cursor-pointer">
              {/* Rank badge */}
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: idx === 0 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', color: idx === 0 ? '#ef4444' : '#64748b' }}
              >
                {idx + 1}
              </div>

              {/* Ward name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{ward.name}</span>
                  <span className="text-xs font-bold" style={{ color: riskColor }}>{ward.riskScore}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ward.riskScore}%`, background: `linear-gradient(90deg, ${riskColor}88, ${riskColor})` }}
                  />
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{getRiskLabel(ward.riskScore)} · {ward.population.toLocaleString('en-IN')} pop.</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-900/20">
        <button className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors">
          View all wards on Risk Map <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Recent AI Detections ─────────────────────────────────────────────────────

function RecentDetections() {
  const [detections, setDetections] = useState(mockInfrastructure.recentDetections)

  useEffect(() => {
    fetch('/api/detections')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.slice(0, 3).map((d: any) => ({
            id: d.id || `DET-${d.detection_code || '001'}`,
            type: d.damage_type || 'pothole',
            location: d.location_description || 'Janpath Road, Ward 14',
            confidence: d.confidence || 0.92,
            severity: d.severity || 'high',
            detected: d.detected_at || new Date().toISOString()
          }))
          setDetections(formatted)
        }
      })
      .catch(err => console.log('Detections API fallback notice:', err))
  }, [])

  return (
    <div className="rounded-xl p-5 flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">AI Detections</div>
          <div className="text-xs text-slate-500 mt-0.5">YOLO11 Road Damage Scanner</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-green-400 font-medium">Live</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {detections.map(det => (
          <div
            key={det.id}
            className="rounded-lg p-3 flex items-start gap-3 transition-colors hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Type icon */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-500/10 border border-orange-500/20">
              <Construction size={14} className="text-orange-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white capitalize">{det.type.replace('_', ' ')}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getSeverityBadge(det.severity)}`}>
                  {det.severity}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{det.location}</div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-600">Confidence:</span>
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: det.confidence >= 0.9 ? '#22c55e' : det.confidence >= 0.75 ? '#f59e0b' : '#f97316' }}
                  >
                    {Math.round(det.confidence * 100)}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 flex items-center gap-1">
                  <Clock size={9} />
                  {timeAgo(det.detected)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Complaints ────────────────────────────────────────────────────────

function RecentComplaints() {
  const [complaints, setComplaints] = useState<any[]>(mockComplaints.slice(0, 4))

  useEffect(() => {
    fetch('/api/complaints?limit=4')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.slice(0, 4).map((c: any) => ({
            id: c.ticket_id || c.id,
            title: c.title,
            ward: c.ward || 'Bhubaneswar Ward',
            category: c.category,
            severity: c.severity,
            status: c.status,
            aiClassification: c.ai_classification || { confidence: 0.94 }
          }))
          setComplaints(formatted)
        }
      })
      .catch(err => console.log('Complaints API fallback notice:', err))
  }, [])

  return (
    <div className="rounded-xl p-5 flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Recent Complaints</div>
          <div className="text-xs text-slate-500 mt-0.5">AI-classified citizen reports</div>
        </div>
        <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">
          {mockOverviewStats.openComplaints} open
        </span>
      </div>

      <div className="space-y-2.5">
        {complaints.map(cmp => {
          const CategoryIcon = getCategoryIcon(cmp.category)
          const { cls: statusCls } = getStatusBadge(cmp.status)
          return (
            <div
              key={cmp.id}
              className="rounded-lg p-3 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10 border border-blue-500/20">
                <CategoryIcon size={14} className="text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-white leading-tight line-clamp-1">{cmp.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{cmp.id} · {cmp.ward}</div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${statusCls}`}>
                    {cmp.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getSeverityBadge(cmp.severity)}`}>
                    {cmp.severity}
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                    <Brain size={9} />
                    AI: {Math.round(cmp.aiClassification.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-900/20">
        <button className="w-full text-xs text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors">
          View all complaints <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ─── Active Alerts ────────────────────────────────────────────────────────────

function ActiveAlerts() {
  return (
    <div className="rounded-xl p-5 flex flex-col" style={CARD_STYLE}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Active Alerts</div>
          <div className="text-xs text-slate-500 mt-0.5">System-generated notifications</div>
        </div>
        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium animate-pulse">
          {mockAlerts.length} active
        </span>
      </div>

      <div className="space-y-2.5">
        {mockAlerts.map(alert => {
          const accent = getAlertAccent(alert.type)
          return (
            <div
              key={alert.id}
              className={`rounded-lg p-3 border ${accent.border} ${accent.bg} cursor-pointer hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-bold uppercase tracking-wide ${accent.text}`}>{alert.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{alert.message}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-slate-600">Ward: {alert.ward}</span>
                    <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                      <Clock size={9} />
                      {timeAgo(alert.time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function AiInsightCard({ insight }: { insight: typeof mockAiInsights[0] }) {
  const factors = Object.entries(insight.factors)
  const maxFactor = Math.max(...factors.map(([, v]) => v))

  const factorColors: Record<string, string> = {
    road_damage: '#f97316',
    water_stress: '#3b82f6',
    flood_exposure: '#06b6d4',
    complaints: '#f59e0b',
    network_centrality: '#a855f7',
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: 'rgba(13,20,38,0.9)',
        border: `1px solid ${insight.riskScore >= 76 ? 'rgba(239,68,68,0.3)' : 'rgba(30,58,138,0.3)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{insight.ward}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{insight.riskLevel} Risk</div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div
            className="text-2xl font-black"
            style={{ color: insight.riskScore >= 76 ? '#ef4444' : '#f97316' }}
          >
            {insight.riskScore}
          </div>
          <div className="text-[10px] text-slate-500">/ 100</div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed">{insight.summary}</p>

      {/* Factor bars */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Contributing Factors</div>
        <div className="space-y-2">
          {factors.map(([key, weight]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-slate-400 capitalize">{key.replace('_', ' ')}</span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: factorColors[key] ?? '#64748b' }}
                >
                  {Math.round(weight * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(weight / maxFactor) * 100}%`,
                    background: factorColors[key] ?? '#64748b',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg p-3" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
        <div className="flex items-start gap-2">
          <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-yellow-400 uppercase tracking-wider font-semibold mb-1">AI Recommendation</div>
            <div className="text-xs text-slate-300 leading-relaxed">{insight.recommendation}</div>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-600">Model confidence: <span className="text-green-400 font-bold">{Math.round(insight.confidence * 100)}%</span></span>
        <span className="text-slate-600">{timeAgo(insight.generatedAt)}</span>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [stats, setStats] = useState<any>(mockOverviewStats)
  const trendData = mockDashboardTrend
  const topInsights = mockAiInsights.slice(0, 2)

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => {
        if (!res.ok) throw new Error('API status ' + res.status)
        return res.json()
      })
      .then(data => {
        if (data) {
          setStats({
            overallRiskScore: data.overall_risk_score ?? data.overallRiskScore ?? mockOverviewStats.overallRiskScore,
            openComplaints: data.open_complaints ?? data.openComplaints ?? mockOverviewStats.openComplaints,
            totalComplaints: data.total_complaints ?? data.totalComplaints ?? 847,
            waterStressWards: data.water_stress_wards ?? data.waterStressWards ?? mockOverviewStats.waterStressWards,
            criticalRoadSegments: data.critical_road_segments ?? data.criticalRoadSegments ?? mockOverviewStats.criticalRoadSegments,
            powerVulnerableAssets: data.power_vulnerable_assets ?? data.powerVulnerableAssets ?? mockOverviewStats.powerVulnerableAssets,
            potentialUnauthorizedSites: data.potential_unauthorized_sites ?? data.potentialUnauthorizedSites ?? mockOverviewStats.potentialUnauthorizedSites,
            activeAlerts: data.active_alerts ?? data.activeAlerts ?? mockOverviewStats.activeAlerts,
            resolvedToday: data.resolved_today ?? data.resolvedToday ?? mockOverviewStats.resolvedToday,
          })
        }
      })
      .catch(err => {
        console.warn('OverviewPage: using mock overview stats fallback:', err)
      })
  }, [])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Command Overview"
        subtitle="Real-time municipal intelligence — AI recommendations only, not official decisions"
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── ROW 1: 6 Stat Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={AlertTriangle}
            value={stats.overallRiskScore}
            label="Overall Risk Score"
            trend="up"
            trendLabel="+4"
            accentColor="text-red-400"
            bgColor="bg-red-500/10"
            borderColor="border-red-500/20"
          />
          <StatCard
            icon={MessageSquare}
            value={stats.openComplaints}
            label="Open Complaints"
            trend="up"
            trendLabel="+23"
            accentColor="text-yellow-400"
            bgColor="bg-yellow-500/10"
            borderColor="border-yellow-500/20"
          />
          <StatCard
            icon={Droplets}
            value={stats.waterStressWards}
            label="Water Stress Wards"
            trend="neutral"
            accentColor="text-blue-400"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-500/20"
          />
          <StatCard
            icon={Construction}
            value={stats.criticalRoadSegments}
            label="Critical Road Segments"
            trend="up"
            trendLabel="+2"
            accentColor="text-orange-400"
            bgColor="bg-orange-500/10"
            borderColor="border-orange-500/20"
          />
          <StatCard
            icon={Zap}
            value={stats.powerVulnerableAssets}
            label="Power Vulnerable Assets"
            trend="down"
            trendLabel="-1"
            accentColor="text-purple-400"
            bgColor="bg-purple-500/10"
            borderColor="border-purple-500/20"
          />
          <StatCard
            icon={Building2}
            value={stats.potentialUnauthorizedSites}
            label="Unauthorized Sites"
            trend="up"
            trendLabel="+1"
            accentColor="text-red-400"
            bgColor="bg-red-500/10"
            borderColor="border-red-500/20"
          />
        </div>

        {/* ── ROW 2: Trend Chart + Ward Leaderboard ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Area Chart — 2/3 width */}
          <div className="lg:col-span-2 rounded-xl p-5" style={CARD_STYLE}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-semibold text-white">7-Day Complaint Trend</div>
                <div className="text-xs text-slate-500 mt-0.5">New complaints vs resolved cases</div>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full bg-red-400 inline-block" />
                  <span className="text-slate-400">Complaints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full bg-green-400 inline-block" />
                  <span className="text-slate-400">Resolved</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="complaints"
                  name="Complaints"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#gradComplaints)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#gradResolved)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary stats below chart */}
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-blue-900/20">
              {[
                { label: 'Avg Daily Complaints', value: Math.round(trendData.reduce((a, d) => a + d.complaints, 0) / trendData.length), color: '#ef4444' },
                { label: 'Avg Daily Resolved', value: Math.round(trendData.reduce((a, d) => a + d.resolved, 0) / trendData.length), color: '#22c55e' },
                { label: 'Avg Risk Score', value: Math.round(trendData.reduce((a, d) => a + d.riskScore, 0) / trendData.length), color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-[11px] text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ward Risk Leaderboard — 1/3 width */}
          <div className="lg:col-span-1">
            <WardRiskLeaderboard />
          </div>
        </div>

        {/* ── ROW 3: Detections | Complaints | Alerts ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RecentDetections />
          <RecentComplaints />
          <ActiveAlerts />
        </div>

        {/* ── ROW 4: AI Insights ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain size={16} className="text-purple-400" />
                AI Ward Intelligence
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Machine learning risk analysis · <span className="text-yellow-400">⚠ Advisory only — not official assessments</span>
              </div>
            </div>
            <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              View all insights <ChevronRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topInsights.map(insight => (
              <AiInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-lg px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-yellow-400 font-semibold">AI Advisory Notice: </span>
            All risk scores, detections, and recommendations are generated by machine learning models and are intended to{' '}
            <em>assist</em> municipal decision-making — not replace official assessments. Data should be verified by qualified professionals
            before any action is taken. Confidence levels indicate model certainty, not operational ground-truth.
          </p>
        </div>

      </div>
    </div>
  )
}
