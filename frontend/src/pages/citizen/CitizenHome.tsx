import { useNavigate } from 'react-router-dom'
import {
  FilePen, Search, Building2, MessageCircle,
  CheckCircle2, Bot, ClipboardList,
  ArrowRight, TrendingUp, Clock, SmilePlus, MapPin,
} from 'lucide-react'

const stats = [
  { label: 'Complaints Resolved', value: '12,847', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Avg. Resolution Time', value: '4.2 days', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Citizen Satisfaction', value: '87%', icon: SmilePlus, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Active Monitoring Wards', value: '15', icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50' },
]

const steps = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Report Issue',
    desc: 'Upload a photo, describe the problem, and share your location. Takes less than 2 minutes.',
    color: 'bg-blue-600',
  },
  {
    step: '02',
    icon: Bot,
    title: 'AI Classification',
    desc: 'Our AI analyzes your report and automatically routes it to the right department with priority scoring.',
    color: 'bg-purple-600',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Track & Resolve',
    desc: 'Get real-time status updates at every stage until your issue is fully resolved.',
    color: 'bg-green-600',
  },
]

const resolutions = [
  {
    id: 'CMP-2024-0831',
    category: 'Road',
    title: 'Pothole on MG Road near School Gate',
    ward: 'Ward 7',
    submitted: '12 Sep 2024',
    resolved: '16 Sep 2024',
    time: '4 days',
    before: 'Large pothole causing accidents and vehicle damage reported by 3 residents.',
    after: 'Bituminous patch laid and road surface levelled by PWD team. Area inspected and cleared.',
  },
  {
    id: 'CMP-2024-0795',
    category: 'Water',
    title: 'Contaminated Water Supply – Sector 4',
    ward: 'Ward 3',
    submitted: '8 Sep 2024',
    resolved: '10 Sep 2024',
    time: '2 days',
    before: 'Residents reported discoloured and foul-smelling water from municipal supply.',
    after: 'Pipeline leak identified and repaired. Water quality tested and certified safe.',
  },
  {
    id: 'CMP-2024-0762',
    category: 'Waste',
    title: 'Illegal Dumping near Riverside Park',
    ward: 'Ward 11',
    submitted: '5 Sep 2024',
    resolved: '7 Sep 2024',
    time: '2 days',
    before: 'Construction debris and household waste dumped illegally blocking a public walkway.',
    after: 'Waste cleared by sanitation department. Anti-dumping sign installed. CCTV enabled.',
  },
]

const categoryColor: Record<string, string> = {
  Road: 'bg-orange-100 text-orange-700',
  Water: 'bg-blue-100 text-blue-700',
  Waste: 'bg-green-100 text-green-700',
}

export default function CitizenHome() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-sm">
            VANGUARD CITY
          </h1>
          <p className="text-xl sm:text-2xl font-semibold text-blue-100 mb-4">
            Building a safer, smarter city.
          </p>
          <p className="text-base sm:text-lg text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Report civic issues, track complaints, and access municipal services.
            Powered by AI-driven urban intelligence.
          </p>

          {/* 2×2 CTA Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              onClick={() => navigate('/citizen/report')}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all group"
            >
              <FilePen className="w-8 h-8 text-white" />
              <span className="font-semibold text-white text-sm sm:text-base">Report an Issue</span>
              <ArrowRight className="w-4 h-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => navigate('/citizen/track')}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all group"
            >
              <Search className="w-8 h-8 text-white" />
              <span className="font-semibold text-white text-sm sm:text-base">Track My Complaint</span>
              <ArrowRight className="w-4 h-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => navigate('/citizen/services')}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all group"
            >
              <Building2 className="w-8 h-8 text-white" />
              <span className="font-semibold text-white text-sm sm:text-base">Civic Services</span>
              <ArrowRight className="w-4 h-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => navigate('/citizen/ai')}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all group"
            >
              <MessageCircle className="w-8 h-8 text-white" />
              <span className="font-semibold text-white text-sm sm:text-base">Ask Civic AI</span>
              <ArrowRight className="w-4 h-4 text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white border-b border-gray-100 py-8 px-4 shadow-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-4">
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">How It Works</h2>
            <p className="text-slate-500">Three simple steps from issue to resolution.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {/* connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-10 left-[calc(50%+40px)] right-0 h-0.5 bg-gray-200 z-0" />
                )}
                <div className={`w-16 h-16 ${s.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg z-10`}>
                  <s.icon className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest mb-1">STEP {s.step}</span>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Resolutions ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Recent Resolutions</h2>
            <p className="text-slate-500">Real issues resolved by citizen reports.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {resolutions.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[r.category] ?? 'bg-slate-100 text-slate-600'}`}>
                    {r.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved in {r.time}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-400 mb-1">{r.id} · {r.ward}</p>
                  <h4 className="font-semibold text-slate-800 text-sm mb-3 leading-snug">{r.title}</h4>
                  <div className="space-y-2">
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-0.5">Before</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{r.before}</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg p-2.5">
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-0.5">After</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{r.after}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-[10px] text-slate-400">
                    <span>Submitted: {r.submitted}</span>
                    <span>Resolved: {r.resolved}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-blue-600 py-14 px-4 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">See something that needs fixing?</h2>
        <p className="text-blue-200 mb-8 text-base max-w-xl mx-auto">
          Your report helps keep Vanguard City safe and functional. It takes less than 2 minutes.
        </p>
        <button
          onClick={() => navigate('/citizen/report')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-base shadow-lg"
        >
          <FilePen className="w-5 h-5" />
          Report an Issue Now
        </button>
      </section>
    </div>
  )
}
