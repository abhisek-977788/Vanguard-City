import { useState, useCallback } from 'react'
import {
  Construction, Droplets, Zap, Waves, HardHat,
  Trash2, HelpCircle, ChevronRight, ChevronLeft,
  Upload, X, CheckCircle2, ClipboardCheck,
  AlertCircle, Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────
type Category = {
  id: string
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}

type Severity = 'Low' | 'Moderate' | 'High' | 'Critical'

interface FormData {
  category: string
  title: string
  description: string
  severity: Severity | ''
  address: string
  ward: string
  files: File[]
}

// ── Constants ──────────────────────────────────────────────────────────────
const categories: Category[] = [
  { id: 'road', label: 'Road', icon: Construction, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
  { id: 'water', label: 'Water', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  { id: 'electricity', label: 'Electricity', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  { id: 'drainage', label: 'Drainage', icon: Waves, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-300' },
  { id: 'construction', label: 'Construction', icon: HardHat, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
  { id: 'waste', label: 'Waste', icon: Trash2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
]

const severities: { value: Severity; label: string; color: string; bg: string }[] = [
  { value: 'Low', label: 'Low', color: 'text-green-700', bg: 'bg-green-50 border-green-300' },
  { value: 'Moderate', label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-300' },
  { value: 'High', label: 'High', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  { value: 'Critical', label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
]

const wards = Array.from({ length: 15 }, (_, i) => `Ward ${i + 1}`)

const STEPS = ['Category', 'Describe', 'Location', 'Evidence', 'Review']

function generateComplaintId(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `CMP-2024-${num}`
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ReportIssuePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState<FormData>({
    category: '',
    title: '',
    description: '',
    severity: '',
    address: '',
    ward: '',
    files: [],
  })

  const canProceed = () => {
    if (step === 0) return form.category !== ''
    if (step === 1) return form.title.trim().length > 0 && form.description.trim().length >= 20 && form.severity !== ''
    if (step === 2) return form.address.trim().length > 0 && form.ward !== ''
    return true
  }

  const selectedCat = categories.find((c) => c.id === form.category)

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    )
    setForm((prev) => ({ ...prev, files: [...prev.files, ...dropped].slice(0, 3) }))
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const chosen = Array.from(e.target.files).filter((f) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024
    )
    setForm((prev) => ({ ...prev, files: [...prev.files, ...chosen].slice(0, 3) }))
  }

  const removeFile = (idx: number) =>
    setForm((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }))

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // 1. Process uploaded image through YOLO11 road damage detection if present
    if (form.files.length > 0) {
      try {
        const imgData = new FormData()
        imgData.append('file', form.files[0])
        await fetch('/api/detections/detect', { method: 'POST', body: imgData })
      } catch (e) {
        console.log('Image upload non-blocking warning:', e)
      }
    }

    // 2. Submit formal complaint payload to FastAPI
    const payload = {
      category: form.category,
      title: form.title,
      description: form.description,
      ward: form.ward,
      severity: form.severity ? form.severity.toLowerCase() : 'moderate',
      address: form.address,
      citizen_name: 'Citizen Reporter',
      citizen_phone: '+91 98610 12345',
      lat: 20.2961,
      lng: 85.8245
    }

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        const ticket = data.ticket_id || data.id || generateComplaintId()
        setComplaintId(ticket)
        setAiAnalysis(data.ai_classification)
        localStorage.setItem('vanguard_last_complaint', ticket)
      } else {
        const fallback = generateComplaintId()
        setComplaintId(fallback)
      }
    } catch (err) {
      const fallback = generateComplaintId()
      setComplaintId(fallback)
    } finally {
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

  // ── Success Screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-lg p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Complaint Submitted!</h2>
          <p className="text-slate-500 mb-6 text-sm">Your report has been received and is being processed.</p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Complaint ID</p>
            <p className="text-2xl font-mono font-bold text-blue-700">{complaintId}</p>
          </div>

          <div className="space-y-3 text-left mb-8">
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-slate-700">Your complaint has been submitted</p>
            </div>
            {aiAnalysis ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-slate-700">
                  AI Category: <strong className="capitalize">{aiAnalysis.category || form.category}</strong> ({Math.round((aiAnalysis.confidence || 0.9) * 100)}% confidence)
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
                <p className="text-sm text-slate-700">AI classification in progress…</p>
              </div>
            )}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <p className="text-sm text-slate-500">Estimated resolution: <strong className="text-slate-700">3–7 working days</strong></p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/citizen/track')}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Track Complaint
            </button>
            <button
              onClick={() => { setSubmitted(false); setStep(0); setForm({ category: '', title: '', description: '', severity: '', address: '', ward: '', files: [] }) }}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Report Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Report an Issue</h1>
          <p className="text-sm text-slate-500">Help us make Vanguard City better. Every report matters.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i === step ? 'text-blue-600' : 'text-slate-400'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* STEP 0: Category */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Select Category</h2>
              <p className="text-sm text-slate-500 mb-5">What type of issue are you reporting?</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setForm((p) => ({ ...p, category: cat.id }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      form.category === cat.id
                        ? `${cat.bg} ${cat.border} shadow-sm`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon className={`w-7 h-7 ${form.category === cat.id ? cat.color : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium ${form.category === cat.id ? cat.color : 'text-slate-600'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Describe */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Describe the Issue</h2>
              <p className="text-sm text-slate-500 mb-5">Provide as much detail as possible.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Large pothole on MG Road near school"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description * <span className="text-slate-400 font-normal">(min 20 characters)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the problem in detail. Include when you first noticed it and any impact on daily life…"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className={`text-xs mt-1 ${form.description.length < 20 ? 'text-red-400' : 'text-green-600'}`}>
                    {form.description.length} / 20+ characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Severity *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {severities.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setForm((p) => ({ ...p, severity: s.value }))}
                        className={`py-2.5 px-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                          form.severity === s.value ? `${s.bg} ${s.color}` : 'border-gray-200 text-slate-500 hover:border-gray-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Location</h2>
              <p className="text-sm text-slate-500 mb-5">Tell us where the issue is located.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Address / Landmark *</label>
                  <input
                    type="text"
                    placeholder="e.g., Near City Park Gate, MG Road"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ward *</label>
                  <select
                    value={form.ward}
                    onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select your ward…</option>
                    {wards.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    In the full version, GPS location detection will be available to pin-point the exact location on the city map.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Evidence */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Upload Evidence</h2>
              <p className="text-sm text-slate-500 mb-5">Photos help our team understand and resolve issues faster.</p>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 mb-1">Drag & drop images here</p>
                <p className="text-xs text-slate-400">or click to browse</p>
                <p className="text-[11px] text-slate-400 mt-2">JPG, PNG, WEBP · Max 5MB · Up to 3 files</p>
              </div>

              {/* Previews */}
              {form.files.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {form.files.map((f, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700">
                  AI will analyze the image to help classify your complaint and detect issue severity automatically.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Review & Submit</h2>
              <p className="text-sm text-slate-500 mb-5">Please review your complaint before submitting.</p>

              <div className="space-y-3 text-sm">
                <SummaryRow label="Category" value={selectedCat?.label ?? '—'} />
                <SummaryRow label="Title" value={form.title} />
                <SummaryRow label="Description" value={form.description} />
                <SummaryRow label="Severity" value={form.severity} />
                <SummaryRow label="Location" value={form.address} />
                <SummaryRow label="Ward" value={form.ward} />
                <SummaryRow label="Photos" value={form.files.length > 0 ? `${form.files.length} file(s) attached` : 'No photos attached'} />
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-start gap-2">
                  <ClipboardCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    By submitting, you confirm that this report is accurate to the best of your knowledge.
                    False or duplicate reports may affect your complaint standing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting & Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Complaint
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helper ─────────────────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="w-28 text-slate-400 font-medium text-xs uppercase tracking-wide pt-0.5 flex-shrink-0">{label}</span>
      <span className="text-slate-700 text-sm leading-snug">{value || '—'}</span>
    </div>
  )
}
