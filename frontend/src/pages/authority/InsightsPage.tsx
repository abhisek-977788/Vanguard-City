import { Brain, TrendingUp, AlertTriangle, Info, Lightbulb, Cpu, BarChart2, Target } from 'lucide-react'
import { mockAiInsights, mockWards } from '../../data/mockData'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { formatDateTime, getRiskBadgeClass } from '../../lib/utils'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type Insight = (typeof mockAiInsights)[number]

type FactorKey =
  | 'road_damage'
  | 'water_stress'
  | 'flood_exposure'
  | 'complaints'
  | 'network_centrality'

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────
const FACTOR_META: Record<FactorKey, { label: string; color: string; bar: string }> = {
  road_damage:        { label: 'Road Damage',       color: 'text-orange-400', bar: '#f97316' },
  water_stress:       { label: 'Water Stress',       color: 'text-blue-400',   bar: '#3b82f6' },
  flood_exposure:     { label: 'Flood Exposure',     color: 'text-cyan-400',   bar: '#06b6d4' },
  complaints:         { label: 'Complaints',         color: 'text-red-400',    bar: '#ef4444' },
  network_centrality: { label: 'Network Centrality', color: 'text-purple-400', bar: '#a855f7' },
}

const RISK_SCORE_COLOR = (score: number): string => {
  if (score >= 85) return '#ef4444'
  if (score >= 70) return '#f97316'
  if (score >= 50) return '#f59e0b'
  return '#22c55e'
}

const TREND_OPTIONS = ['↑ Rising', '→ Stable', '↓ Falling']
const seededTrend = (wardId: number) => TREND_OPTIONS[wardId % 3]

// ──────────────────────────────────────────────────────────────────────────────
// Factor Bars — horizontal stacked progress
// ──────────────────────────────────────────────────────────────────────────────
function FactorBars({ factors }: { factors: Record<FactorKey, number> }) {
  const entries = Object.entries(factors) as [FactorKey, number][]
  const chartData = entries.map(([key, val]) => ({
    key,
    name: FACTOR_META[key]?.label ?? key,
    value: val,
    color: FACTOR_META[key]?.bar ?? '#6b7280',
  }))

  return (
    <div className="space-y-3">
      {/* Stacked visual bar */}
      <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
        {chartData.map(d => (
          <div
            key={d.key}
            className="h-full"
            style={{ width: `${d.value * 100}%`, background: d.color }}
            title={`${d.name}: ${(d.value * 100).toFixed(0)}%`}
          />
        ))}
      </div>

      {/* Individual factor rows */}
      <div className="space-y-2">
        {chartData.map(d => (
          <div key={d.key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-400 w-36 truncate">{d.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.value * 100}%`, background: d.color }}
              />
            </div>
            <span className="text-xs font-medium text-slate-300 w-8 text-right">
              {(d.value * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Insight Card
// ──────────────────────────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: Insight }) {
  const scoreColor = RISK_SCORE_COLOR(insight.riskScore)
  const conf = Math.round(insight.confidence * 100)

  return (
    <div
      className="rounded-xl border border-blue-900/30 p-5 space-y-4 flex flex-col"
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500 font-mono">{insight.id}</div>
          <div className="text-base font-semibold text-white mt-0.5">{insight.ward}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-4xl font-black leading-none" style={{ color: scoreColor }}>
            {insight.riskScore}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Risk Score</div>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskBadgeClass(insight.riskLevel)}`}
        >
          <AlertTriangle size={11} />
          {insight.riskLevel} Risk
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-300 leading-relaxed">{insight.summary}</p>

      {/* Factor Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <BarChart2 size={12} />
          Factor Breakdown
        </div>
        <FactorBars factors={insight.factors as Record<FactorKey, number>} />
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border border-blue-600/20 bg-blue-600/10 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 mb-1">
          <Lightbulb size={12} />
          Recommended Action
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{insight.recommendation}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-blue-900/20">
        <div className="flex items-center gap-1.5">
          <Brain size={12} className="text-blue-400" />
          <span className="text-xs text-slate-500">AI Confidence:</span>
          <span
            className={`text-xs font-semibold ${conf >= 90 ? 'text-green-400' : conf >= 75 ? 'text-yellow-400' : 'text-orange-400'}`}
          >
            {conf}%
          </span>
        </div>
        <span className="text-[10px] text-slate-600">{formatDateTime(insight.generatedAt)}</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Ward Risk Leaderboard
// ──────────────────────────────────────────────────────────────────────────────
// Static dominant-factor map (production would derive dynamically from model outputs)
const WARD_DOMINANT_FACTOR: Record<string, string> = {
  'Ward 9':  'Road Damage',
  'Ward 14': 'Road Damage',
  'Ward 5':  'Water Stress',
  'Ward 12': 'Water Stress',
  'Ward 7':  'Flood Exposure',
  'Ward 2':  'Complaints',
  'Ward 3':  'Flood Exposure',
  'Ward 10': 'Complaints',
  'Ward 6':  'Network Centrality',
  'Ward 13': 'Complaints',
  'Ward 1':  'Road Damage',
  'Ward 11': 'Water Stress',
  'Ward 4':  'Network Centrality',
  'Ward 15': 'Road Damage',
  'Ward 8':  'Water Stress',
}

const GRID = '40px 120px 140px 110px 100px 1fr 80px'

function WardLeaderboard() {
  const sorted = [...mockWards].sort((a, b) => b.riskScore - a.riskScore)

  const trendColor = (t: string) => {
    if (t.includes('↑')) return 'text-red-400'
    if (t.includes('↓')) return 'text-green-400'
    return 'text-slate-400'
  }

  const riskLabel = (score: number) => {
    if (score >= 85) return 'Critical'
    if (score >= 70) return 'High'
    if (score >= 50) return 'Moderate'
    return 'Low'
  }

  return (
    <div
      className="rounded-xl border border-blue-900/30 overflow-hidden"
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      {/* Title */}
      <div className="px-5 py-4 border-b border-blue-900/30 flex items-center gap-2">
        <TrendingUp size={16} className="text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Ward Risk Leaderboard</h2>
        <span className="ml-auto text-xs text-slate-500">All 15 wards ranked by AI risk score</span>
      </div>

      {/* Column headers */}
      <div className="grid gap-2 px-5 py-2 border-b border-blue-900/20" style={{ gridTemplateColumns: GRID }}>
        {['Rank', 'Ward', 'Risk Score', 'Risk Level', 'Population', 'Dominant Factor', 'Trend'].map(h => (
          <div key={h} className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">{h}</div>
        ))}
      </div>

      {/* Data rows */}
      <div className="divide-y divide-blue-900/10">
        {sorted.map((ward, idx) => {
          const rank = idx + 1
          const trend = seededTrend(ward.id)
          const scoreColor = RISK_SCORE_COLOR(ward.riskScore)
          const level = riskLabel(ward.riskScore)

          return (
            <div
              key={ward.id}
              className="grid gap-2 px-5 py-2.5 items-center hover:bg-white/[0.02] transition-colors"
              style={{ gridTemplateColumns: GRID }}
            >
              <div className={`text-sm font-bold ${rank <= 3 ? 'text-orange-400' : 'text-slate-500'}`}>
                #{rank}
              </div>
              <div className="text-sm text-white font-medium">{ward.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: scoreColor }}>
                  {ward.riskScore}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ward.riskScore}%`, background: scoreColor }}
                  />
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getRiskBadgeClass(level)}`}
              >
                {level}
              </span>
              <span className="text-xs text-slate-400">{(ward.population / 1000).toFixed(0)}K</span>
              <span className="text-xs text-slate-400 truncate">
                {WARD_DOMINANT_FACTOR[ward.name] ?? 'Road Damage'}
              </span>
              <span className={`text-xs font-medium ${trendColor(trend)}`}>{trend}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// AI Model Info Card
// ──────────────────────────────────────────────────────────────────────────────
interface ModelCardProps {
  name: string
  model: string
  inputs: string[]
  outputs: string[]
  icon: React.ReactNode
  accent: string
}

function ModelCard({ name, model, inputs, outputs, icon, accent }: ModelCardProps) {
  return (
    <div
      className="rounded-xl border border-blue-900/30 p-5 space-y-4"
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${accent}`}>{icon}</div>
        <div>
          <div className="text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-blue-400 font-mono mt-0.5">{model}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-600 font-semibold mb-2">Inputs</div>
          <ul className="space-y-1">
            {inputs.map(inp => (
              <li key={inp} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                {inp}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-600 font-semibold mb-2">Outputs</div>
          <ul className="space-y-1">
            {outputs.map(out => (
              <li key={out} className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                {out}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="AI Insights"
        subtitle="Machine learning-generated prioritization scores — AI recommendations only, not official assessments"
      />

      <div className="flex-1 p-6 space-y-8">

        {/* ── Disclaimer ── */}
        <div
          className="rounded-xl border border-blue-600/30 p-4 flex gap-3"
          style={{ background: 'rgba(37,99,235,0.07)' }}
        >
          <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-300">
              AI-Generated Insights — For Decision Support Only
            </p>
            <p className="text-xs text-blue-400/70 leading-relaxed">
              All risk scores and recommendations are generated by AI models. They are{' '}
              <strong>prioritization tools to support human decision-making</strong>, not definitive
              assessments of actual risk. Always verify AI outputs with ground-truth data before
              taking action. Model outputs may contain errors or reflect incomplete data.
            </p>
          </div>
        </div>

        {/* ── Section: Top Priority Ward Cards ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white">Top Priority Wards</h2>
            <span className="text-xs text-slate-500 ml-1">— AI-generated prioritization</span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {mockAiInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>

        {/* ── Section: Ward Risk Leaderboard ── */}
        <WardLeaderboard />

        {/* ── Section: AI Model Information ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white">AI Model Information</h2>
            <span className="text-xs text-slate-500 ml-1">— Models powering this platform</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModelCard
              name="Road Damage Detection"
              model="YOLO11 Computer Vision"
              icon={<AlertTriangle size={16} className="text-orange-400" />}
              accent="bg-orange-500/10 border border-orange-500/20"
              inputs={[
                'Road images (drone/camera)',
                'GPS coordinates',
                'Timestamp metadata',
              ]}
              outputs={[
                'Damage type (pothole, crack, etc.)',
                'Severity classification',
                'Geolocation of defect',
              ]}
            />
            <ModelCard
              name="Water Demand Prediction"
              model="XGBoost Regressor"
              icon={<TrendingUp size={16} className="text-blue-400" />}
              accent="bg-blue-500/10 border border-blue-500/20"
              inputs={[
                'Historical demand (30 days)',
                'Rainfall data',
                'Temperature forecast',
                'Population density',
              ]}
              outputs={[
                'Predicted daily demand (MLD)',
                'Supply deficit forecast',
                'Ward stress index',
              ]}
            />
            <ModelCard
              name="Ward Risk Scoring"
              model="XGBoost Ensemble"
              icon={<Target size={16} className="text-purple-400" />}
              accent="bg-purple-500/10 border border-purple-500/20"
              inputs={[
                'Road damage score',
                'Water stress index',
                'Flood exposure layer',
                'Complaint density',
                'Network centrality',
              ]}
              outputs={[
                'Composite risk score (0–100)',
                'Risk level (Low → Critical)',
                'Prioritization ranking',
              ]}
            />
          </div>

          {/* Model disclaimer footer */}
          <div
            className="rounded-xl border border-blue-900/30 p-4 flex gap-3"
            style={{ background: 'rgba(13,20,38,0.9)' }}
          >
            <Info size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              All models are retrained periodically with updated municipal data. Model performance
              metrics and version history are available via the Platform Administration panel. AI
              outputs should be reviewed alongside official reports and field assessments. Confidence
              values indicate model certainty under current data conditions and{' '}
              <strong className="text-slate-400">
                are not indicative of real-world ground truth
              </strong>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
