import { useState, useEffect } from 'react'
import {
  Search, CheckCircle2, Clock, MapPin, User,
  Bot, Construction, AlertCircle, Tag, ChevronRight,
} from 'lucide-react'

// ── Hardcoded Example Complaint ────────────────────────────────────────────
const EXAMPLE_COMPLAINT = {
  id: 'CMP-2024-0847',
  title: 'Large Pothole on MG Road near School Gate',
  description:
    'A large pothole has developed at the junction of MG Road and School Street. The pothole is approximately 60cm wide and 15cm deep. It is causing significant danger to two-wheelers, especially during rain when it fills with water and becomes invisible.',
  category: 'Road',
  ward: 'Ward 7',
  address: 'MG Road, near Govt. Higher Secondary School Gate, Ward 7',
  submittedDate: '12 Sep 2024',
  submittedTime: '09:34 AM',
  department: 'Public Works Department (PWD)',
  assignedOfficer: 'Eng. Ramesh Kumar',
  status: 'In Progress',
  aiAnalysis: {
    category: 'Road Damage',
    keywords: ['pothole', 'school', 'rain', 'danger', 'two-wheeler'],
    confidence: 94,
    priority: 'High',
    summary:
      'Image analysis confirms road surface damage. Severity classified as High based on dimensions and proximity to school zone.',
  },
  timeline: [
    { step: 'Complaint Submitted', date: '12 Sep 2024, 9:34 AM', done: true, note: 'Received via Citizen Portal' },
    { step: 'AI Classification Complete', date: '12 Sep 2024, 9:35 AM', done: true, note: 'Category: Road Damage · Confidence: 94%' },
    { step: 'Assigned to Department', date: '12 Sep 2024, 11:00 AM', done: true, note: 'Routed to Public Works Department (PWD)' },
    { step: 'Under Review', date: '13 Sep 2024, 10:20 AM', done: true, note: 'Field inspection scheduled' },
    { step: 'Work In Progress', date: '15 Sep 2024', done: false, current: true, note: 'Repair crew dispatched to site' },
    { step: 'Resolved', date: null, done: false, current: false, note: 'Awaiting completion' },
  ],
}

const statusStyle: Record<string, string> = {
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Resolved: 'bg-green-100 text-green-700 border-green-200',
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export default function TrackComplaintPage() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [found, setFound] = useState(false)
  const [complaint, setComplaint] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Auto-fill last submitted complaint ID if available
  useEffect(() => {
    const lastId = localStorage.getItem('vanguard_last_complaint')
    if (lastId) {
      setQuery(lastId)
      searchComplaint(lastId)
    }
  }, [])

  const searchComplaint = async (targetId: string) => {
    const q = targetId.trim().toUpperCase()
    if (!q) return
    setSearched(true)
    setLoading(true)

    try {
      const res = await fetch('/api/complaints')
      if (res.ok) {
        const list = await res.json()
        const matched = list.find((c: any) =>
          (c.ticket_id && c.ticket_id.toUpperCase() === q) ||
          (c.id && c.id.toString().toUpperCase() === q)
        )

        if (matched) {
          const ai = matched.ai_classification || {}
          const formatted = {
            id: matched.ticket_id || matched.id,
            title: matched.title,
            description: matched.description,
            category: matched.category,
            ward: matched.ward || 'Bhubaneswar Ward',
            address: matched.address || 'Reported Location',
            submittedDate: matched.submitted_at ? new Date(matched.submitted_at).toLocaleDateString('en-IN') : 'Recent',
            submittedTime: matched.submitted_at ? new Date(matched.submitted_at).toLocaleTimeString('en-IN') : 'Just now',
            department: matched.department || 'Municipal Operations',
            assignedOfficer: 'Field Response Officer',
            status: matched.status === 'in_progress' ? 'In Progress' : matched.status === 'resolved' ? 'Resolved' : 'Under Review',
            aiAnalysis: {
              category: ai.category || matched.category,
              keywords: ai.keywords || ['civic_issue'],
              confidence: Math.round((ai.confidence || 0.92) * 100),
              priority: (matched.severity || 'Moderate').toUpperCase(),
              summary: `Automated triage completed. Routed to ${matched.department || 'Municipal Operations'}.`,
            },
            timeline: [
              { step: 'Complaint Submitted', date: 'Recorded in PostGIS database', done: true, note: 'Received via Citizen Portal' },
              { step: 'AI Classification Complete', date: `Category: ${matched.category}`, done: true, note: `Confidence: ${Math.round((ai.confidence || 0.92) * 100)}%` },
              { step: 'Assigned to Department', date: matched.department || 'Municipal Operations', done: true, note: 'Triage complete' },
              { step: 'Under Review', date: 'In progress', done: true, note: 'Field inspection scheduled' },
              { step: 'Work In Progress', date: null, done: false, current: true, note: 'Action team notified' },
              { step: 'Resolved', date: null, done: false, current: false, note: 'Awaiting completion' },
            ],
          }
          setComplaint(formatted)
          setFound(true)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn('Live complaint search failed:', err)
    }

    // Fallback to example complaint
    if (q === EXAMPLE_COMPLAINT.id) {
      setFound(true)
      setComplaint(EXAMPLE_COMPLAINT)
    } else {
      setFound(false)
      setComplaint(null)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    searchComplaint(query)
  }

  const loadExample = () => {
    setQuery(EXAMPLE_COMPLAINT.id)
    searchComplaint(EXAMPLE_COMPLAINT.id)
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Track Your Complaint</h1>
          <p className="text-sm text-slate-500">Enter your Complaint ID to see real-time status updates.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Complaint ID (e.g., CMP-2024-0847)"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 ml-1">
            Don't have an ID?{' '}
            <button onClick={loadExample} className="text-blue-600 hover:underline font-medium">
              Load example complaint
            </button>
          </p>
        </div>

        {/* Not Found */}
        {searched && !found && (
          <div className="bg-white border border-red-100 rounded-2xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Complaint not found</p>
            <p className="text-sm text-slate-500">
              No complaint was found for ID <strong>"{query}"</strong>. Please check the ID and try again.
            </p>
          </div>
        )}

        {/* Complaint Detail */}
        {found && complaint && (
          <div className="space-y-5">
            {/* Header Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {complaint.id}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusStyle[complaint.status] ?? ''}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 leading-snug mb-1">{complaint.title}</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">{complaint.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                <MetaItem icon={Construction} label="Category" value={complaint.category} />
                <MetaItem icon={MapPin} label="Ward" value={complaint.ward} />
                <MetaItem icon={Clock} label="Submitted" value={complaint.submittedDate} />
                <MetaItem icon={User} label="Officer" value={complaint.assignedOfficer} />
              </div>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Address: </span>
                  {complaint.address}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Status Timeline
              </h3>
              <div className="space-y-0">
                {complaint.timeline.map((t: any, i: number) => (
                  <div key={t.step} className="flex gap-4">
                    {/* Dot + Line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        t.done ? 'bg-green-500' : t.current ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-200'
                      }`}>
                        {t.done ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : t.current ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                        )}
                      </div>
                      {i < complaint.timeline.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${t.done ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-5 flex-1 ${i === complaint.timeline.length - 1 ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-semibold leading-tight ${
                        t.done ? 'text-green-700' : t.current ? 'text-blue-700' : 'text-slate-400'
                      }`}>
                        {t.step}
                        {t.current && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                            Current
                          </span>
                        )}
                      </p>
                      {t.date && (
                        <p className="text-xs text-slate-400 mt-0.5">{t.date}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{t.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                AI Analysis Result
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide mb-1">Category</p>
                  <p className="text-sm font-bold text-purple-800">{complaint.aiAnalysis.category}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-green-500 font-semibold uppercase tracking-wide mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-green-700">{complaint.aiAnalysis.confidence}%</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-orange-500 font-semibold uppercase tracking-wide mb-1">Priority</p>
                  <p className="text-sm font-bold text-orange-700">{complaint.aiAnalysis.priority}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mb-1">Auto-Routed</p>
                  <p className="text-sm font-bold text-blue-700">Yes</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Keywords Detected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {complaint.aiAnalysis.keywords.map((kw: string) => (
                    <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <p className="text-xs text-purple-700 leading-relaxed">{complaint.aiAnalysis.summary}</p>
              </div>
            </div>

            {/* Dept info */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-1">Assigned Department</p>
                <p className="font-semibold text-slate-800">{complaint.department}</p>
                <p className="text-sm text-slate-500 mt-0.5">Officer: {complaint.assignedOfficer}</p>
              </div>
              <button className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                View Department
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────
function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  )
}
