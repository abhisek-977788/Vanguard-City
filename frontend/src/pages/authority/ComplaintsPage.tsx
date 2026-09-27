import { useState, useEffect } from 'react'
import {
  Road,
  Droplets,
  Zap,
  Waves,
  HardHat,
  Trash2,
  AlertTriangle,
  Clock,
  Eye,
  UserPlus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  Bot,
} from 'lucide-react'
import { mockComplaints } from '../../data/mockData'
import { Badge } from '../../components/ui/badge'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { formatDateTime, timeAgo } from '../../lib/utils'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type Complaint = (typeof mockComplaints)[number]

// ──────────────────────────────────────────────────────────────────────────────
// Helper maps
// ──────────────────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  road: <Road size={14} />,
  water: <Droplets size={14} />,
  electricity: <Zap size={14} />,
  drainage: <Waves size={14} />,
  construction: <HardHat size={14} />,
  waste: <Trash2 size={14} />,
}

const CATEGORY_LABELS: Record<string, string> = {
  road: 'Road',
  water: 'Water',
  electricity: 'Electricity',
  drainage: 'Drainage',
  construction: 'Construction',
  waste: 'Waste',
}

const SEVERITY_CLASSES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  moderate: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  low: 'bg-green-500/20 text-green-400 border border-green-500/40',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

// ──────────────────────────────────────────────────────────────────────────────
// Stat Card
// ──────────────────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: number | string
  color: string   // tailwind text color class
  border: string  // tailwind border/bg classes
}

function StatCard({ label, value, color, border }: StatCardProps) {
  return (
    <div
      className={`flex-1 rounded-xl border px-5 py-4 ${border}`}
      style={{ background: 'rgba(13,20,38,0.9)' }}
    >
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = ['all', 'road', 'water', 'electricity', 'drainage', 'construction', 'waste']
  const statuses = ['all', 'open', 'under_review', 'in_progress', 'resolved']

  useEffect(() => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.append('category', categoryFilter)
    if (statusFilter !== 'all') params.append('status', statusFilter)

    fetch(`/api/complaints?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('API status ' + res.status)
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((c: any) => ({
            id: c.id || c.ticket_id,
            category: c.category || 'road',
            title: c.title || 'Untitled Complaint',
            description: c.description || '',
            ward: c.ward || (c.ward_id ? `Ward ${c.ward_id}` : 'Ward 1'),
            severity: c.severity || 'moderate',
            status: c.status || 'open',
            department: c.department || 'General Administration',
            assignedTo: c.assigned_to || c.assignedTo || 'Unassigned',
            submittedAt: c.submitted_at || c.submittedAt || new Date().toISOString(),
            citizenName: c.citizen_name || c.citizenName || 'Anonymous Citizen',
            aiClassification: {
              confidence: c.aiClassification?.confidence ?? c.ai_classification?.confidence ?? 0.88,
              keywords: c.aiClassification?.keywords ?? c.ai_classification?.keywords ?? ['infrastructure', 'maintenance'],
              category: c.aiClassification?.category ?? c.ai_classification?.category ?? c.category ?? 'road',
            },
            location: {
              address: c.address || c.location?.address || 'Bhubaneswar, Odisha',
              lat: c.lat ?? c.location?.lat ?? 20.2961,
              lng: c.lng ?? c.location?.lng ?? 85.8245,
            }
          }))
          setComplaints(normalized as any)
        } else {
          const filteredMock = mockComplaints.filter(c => {
            const catOk = categoryFilter === 'all' || c.category === categoryFilter
            const stOk = statusFilter === 'all' || c.status === statusFilter
            return catOk && stOk
          })
          setComplaints(filteredMock)
        }
      })
      .catch(err => {
        console.warn('ComplaintsPage: using mock fallback:', err)
        const filteredMock = mockComplaints.filter(c => {
          const catOk = categoryFilter === 'all' || c.category === categoryFilter
          const stOk = statusFilter === 'all' || c.status === statusFilter
          return catOk && stOk
        })
        setComplaints(filteredMock)
      })
  }, [categoryFilter, statusFilter])

  const toggleExpand = (id: string) => setExpandedId(prev => (prev === id ? null : id))

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Citizen Complaints"
        subtitle="AI-classified complaint management system"
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Stat Cards ── */}
        <div className="flex gap-4 flex-wrap">
          <StatCard label="Open" value={847} color="text-red-400" border="border-red-500/30 bg-red-500/5" />
          <StatCard label="Under Review" value={234} color="text-yellow-400" border="border-yellow-500/30 bg-yellow-500/5" />
          <StatCard label="In Progress" value={189} color="text-blue-400" border="border-blue-500/30 bg-blue-500/5" />
          <StatCard label="Resolved Today" value={34} color="text-green-400" border="border-green-500/30 bg-green-500/5" />
        </div>

        {/* ── Filter Bar ── */}
        <div
          className="rounded-xl border border-blue-900/30 p-4 space-y-3"
          style={{ background: 'rgba(13,20,38,0.9)' }}
        >
          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide w-16">Category</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat !== 'all' && CATEGORY_ICONS[cat]}
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wide w-16">Status</span>
            {statuses.map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {st === 'all' ? 'All' : STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Complaints Table ── */}
        <div
          className="rounded-xl border border-blue-900/30 overflow-hidden"
          style={{ background: 'rgba(13,20,38,0.9)' }}
        >
          {/* Table header */}
          <div
            className="grid gap-2 px-4 py-3 border-b border-blue-900/30"
            style={{
              gridTemplateColumns: '140px 110px 1fr 90px 80px 110px 90px 120px 80px 100px',
            }}
          >
            {['ID', 'Category', 'Title', 'Ward', 'Severity', 'Status', 'AI Conf.', 'Assigned To', 'Submitted', 'Actions'].map(h => (
              <div key={h} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {complaints.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">No complaints match the selected filters.</div>
          ) : (
            complaints.map(c => (
              <ComplaintRow
                key={c.id}
                complaint={c}
                expanded={expandedId === c.id}
                onToggle={() => toggleExpand(c.id)}
              />
            ))
          )}
        </div>

        <p className="text-xs text-slate-600 text-right">
          Showing {complaints.length} complaints
        </p>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Complaint Row
// ──────────────────────────────────────────────────────────────────────────────
interface ComplaintRowProps {
  complaint: Complaint
  expanded: boolean
  onToggle: () => void
}

function ComplaintRow({ complaint: c, expanded, onToggle }: ComplaintRowProps) {
  const conf = Math.round(c.aiClassification.confidence * 100)

  return (
    <div className="border-b border-blue-900/20 last:border-0">
      {/* Main row — clickable to expand */}
      <button
        className="w-full text-left hover:bg-white/[0.03] transition-colors"
        onClick={onToggle}
      >
        <div
          className="grid gap-2 px-4 py-3 items-center"
          style={{
            gridTemplateColumns: '140px 110px 1fr 90px 80px 110px 90px 120px 80px 100px',
          }}
        >
          {/* ID */}
          <span className="font-mono text-xs text-blue-400">{c.id}</span>

          {/* Category */}
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-blue-400">{CATEGORY_ICONS[c.category]}</span>
            {CATEGORY_LABELS[c.category] ?? c.category}
          </span>

          {/* Title */}
          <span className="text-sm text-white truncate pr-2" title={c.title}>{c.title}</span>

          {/* Ward */}
          <span className="text-xs text-slate-400">{c.ward}</span>

          {/* Severity */}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SEVERITY_CLASSES[c.severity] ?? ''}`}>
            {c.severity}
          </span>

          {/* Status */}
          <Badge variant="status" level={c.status}>
            {STATUS_LABELS[c.status] ?? c.status}
          </Badge>

          {/* AI Confidence */}
          <div className="flex items-center gap-1">
            <Bot size={11} className="text-blue-400 flex-shrink-0" />
            <span className={`text-xs font-medium ${conf >= 90 ? 'text-green-400' : conf >= 75 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {conf}%
            </span>
          </div>

          {/* Assigned To */}
          <span className="text-xs text-slate-400 truncate">
            {c.assignedTo ?? <span className="text-slate-600 italic">Unassigned</span>}
          </span>

          {/* Submitted */}
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={11} />
            {timeAgo(c.submittedAt)}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <button
              className="p-1.5 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-600/40 transition-colors"
              title="View"
            >
              <Eye size={13} />
            </button>
            <button
              className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              title="Assign"
            >
              <UserPlus size={13} />
            </button>
            <span className="ml-auto text-slate-600">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div
          className="mx-4 mb-3 rounded-xl border border-blue-900/30 p-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ background: 'rgba(10,15,30,0.6)' }}
        >
          {/* Description */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <AlertTriangle size={12} />
              Full Description
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{c.description}</p>

            <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              <Bot size={12} className="text-blue-400" />
              AI Keywords
            </div>
            <div className="flex gap-2 flex-wrap">
              {c.aiClassification.keywords.map(kw => (
                <span
                  key={kw}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 text-xs border border-blue-800/40"
                >
                  <Tag size={10} />
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="space-y-3">
            <InfoRow label="Citizen" value={c.citizenName} />
            <InfoRow label="Department" value={c.department} />
            <InfoRow
              label="Location"
              value={`${c.location.lat.toFixed(4)}, ${c.location.lng.toFixed(4)}`}
              icon={<MapPin size={11} className="text-blue-400" />}
            />
            <InfoRow label="Submitted" value={formatDateTime(c.submittedAt)} icon={<Clock size={11} />} />
            <InfoRow
              label="AI Category"
              value={c.aiClassification.category.replace(/_/g, ' ')}
              icon={<Bot size={11} className="text-blue-400" />}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-600 tracking-wide mb-0.5">{label}</div>
      <div className="flex items-center gap-1 text-xs text-slate-300">
        {icon}
        {value}
      </div>
    </div>
  )
}
