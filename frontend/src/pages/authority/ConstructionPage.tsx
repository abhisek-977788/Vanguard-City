import {
  HardHat,
  AlertTriangle,
  CheckCircle,
  Eye,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
  ClipboardCheck,
  Info,
} from 'lucide-react'
import { mockConstructionActivity } from '../../data/mockData'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { Badge } from '../../components/ui/badge'
import { formatDateTime, timeAgo } from '../../lib/utils'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type SiteStatus = 'pending_verification' | 'under_review' | 'verified_authorized'

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  SiteStatus,
  { label: string; icon: React.ReactNode; ring: string; dot: string }
> = {
  pending_verification: {
    label: 'Pending Verification',
    icon: <Clock size={12} />,
    ring: 'border-orange-500/40 bg-orange-500/5',
    dot: 'bg-orange-400',
  },
  under_review: {
    label: 'Under Review',
    icon: <Eye size={12} />,
    ring: 'border-yellow-500/40 bg-yellow-500/5',
    dot: 'bg-yellow-400',
  },
  verified_authorized: {
    label: 'Verified Authorized',
    icon: <CheckCircle size={12} />,
    ring: 'border-green-500/40 bg-green-500/5',
    dot: 'bg-green-400',
  },
}

function statusBadgeLevel(status: string) {
  return status // matches badge.tsx keys exactly
}

// ──────────────────────────────────────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number
  color: string
  border: string
  icon: React.ReactNode
}

function StatCard({ label, value, color, border, icon }: StatCardProps) {
  return (
    <div
      className={`flex-1 min-w-[140px] rounded-xl border px-5 py-4 flex items-start gap-3 ${border}`}
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Detection Card
// ──────────────────────────────────────────────────────────────────────────────
type Site = (typeof mockConstructionActivity)[number]

function DetectionCard({ site }: { site: Site }) {
  const conf = Math.round(site.confidence * 100)
  const cfg = STATUS_CONFIG[site.status as SiteStatus] ?? STATUS_CONFIG.under_review

  return (
    <div
      className={`rounded-xl border p-5 space-y-4 ${cfg.ring}`}
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
            />
            <span className="font-mono text-xs text-blue-400 font-semibold">{site.id}</span>
          </div>
        </div>
        <Badge variant="status" level={statusBadgeLevel(site.status)}>
          <span className="flex items-center gap-1">
            {cfg.icon}
            {cfg.label}
          </span>
        </Badge>
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 text-sm">
        <MapPin size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <span className="text-slate-200">{site.location}</span>
      </div>

      {/* Detected date */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Calendar size={12} />
        <span>Detected {formatDateTime(site.detectedAt)}</span>
        <span className="text-slate-600">({timeAgo(site.detectedAt)})</span>
      </div>

      {/* AI Confidence + area */}
      <div className="grid grid-cols-2 gap-3">
        {/* Confidence */}
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
          <div className="text-[10px] uppercase tracking-wide text-yellow-600 font-semibold mb-1">
            AI Confidence
          </div>
          <div className="text-xl font-bold text-yellow-400">{conf}%</div>
          <div className="text-[10px] text-yellow-600/80 mt-1 leading-tight">
            ⚠ Not definitive — human verification required
          </div>
        </div>

        {/* Estimated area */}
        <div className="rounded-lg border border-blue-900/30 bg-blue-900/10 p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
            Est. Area
          </div>
          <div className="text-xl font-bold text-slate-200">
            {site.area.toLocaleString('en-IN')}
            <span className="text-xs font-normal text-slate-500 ml-1">m²</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-blue-900/30 bg-blue-900/10 p-3 text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-300">Note: </span>
        {site.notes}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap pt-1">
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors">
          <ClipboardCheck size={13} />
          Mark as Reviewed
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
          <Eye size={13} />
          View on Map
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors">
          <ShieldAlert size={13} />
          Request Verification
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function ConstructionPage() {
  const total = mockConstructionActivity.length
  const pending = mockConstructionActivity.filter(s => s.status === 'pending_verification').length
  const review = mockConstructionActivity.filter(s => s.status === 'under_review').length
  const authorized = mockConstructionActivity.filter(s => s.status === 'verified_authorized').length

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Construction Monitor"
        subtitle="AI-detected construction activity — potential unauthorized activity requires human verification"
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Disclaimer ── */}
        <div
          className="rounded-xl border border-orange-500/40 p-4 flex gap-3"
          style={{ background: 'rgba(194,65,12,0.08)' }}
        >
          <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-orange-300">
              ⚠ IMPORTANT: AI Detections Indicate POTENTIAL UNAUTHORIZED ACTIVITY Only
            </p>
            <p className="text-xs text-orange-400/80 leading-relaxed">
              These are <strong>not confirmed violations</strong>. All detections{' '}
              <strong>MUST be verified by an authorized human official</strong> before any enforcement
              action is taken. Computer vision detections do <strong>not</strong> constitute legal
              evidence.
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="flex gap-4 flex-wrap">
          <StatCard
            label="Total Detected"
            value={total}
            color="text-blue-400"
            border="border-blue-500/30"
            icon={<HardHat size={20} />}
          />
          <StatCard
            label="Pending Verification"
            value={pending}
            color="text-orange-400"
            border="border-orange-500/30"
            icon={<Clock size={20} />}
          />
          <StatCard
            label="Under Review"
            value={review}
            color="text-yellow-400"
            border="border-yellow-500/30"
            icon={<Eye size={20} />}
          />
          <StatCard
            label="Verified Authorized"
            value={authorized}
            color="text-green-400"
            border="border-green-500/30"
            icon={<CheckCircle size={20} />}
          />
        </div>

        {/* ── Info note ── */}
        <div className="flex items-start gap-2 p-3 rounded-lg border border-blue-900/30 bg-blue-900/10">
          <Info size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400">
            Detections are generated by satellite / drone image analysis using computer vision models.
            Confidence values reflect model certainty, not legal determination. All sites showing
            <span className="text-orange-400 font-medium"> pending verification</span> or
            <span className="text-yellow-400 font-medium"> under review</span> statuses require
            on-ground inspection by a municipal official before any action.
          </p>
        </div>

        {/* ── Detection Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockConstructionActivity.map(site => (
            <DetectionCard key={site.id} site={site} />
          ))}
        </div>
      </div>
    </div>
  )
}
