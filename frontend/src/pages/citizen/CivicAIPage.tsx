import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Bot, User, AlertCircle, Loader2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  timestamp: string
}

// ── Initial Conversation ───────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'u1',
    role: 'user',
    text: 'How do I apply for a building permit?',
    timestamp: '10:02 AM',
  },
  {
    id: 'a1',
    role: 'ai',
    text: `To apply for a **Building Permit** in Vanguard City, follow these steps:

1. **Download & fill** the BP-01 Application Form from the Town Planning office or municipal website.
2. **Prepare documents:**
   - Architect-certified site plan and floor plan
   - Structural stability certificate
   - Identity and address proof of the property owner
   - Proof of property ownership (sale deed / title document)
3. **Pay the application fee:** ₹500 base fee + ₹10 per sq.ft of proposed construction.
4. **Submit** the application to the Town Planning & Engineering Department (Counter 3, Ground Floor, Municipal Main Office).
5. **Field inspection** will be scheduled within 5 working days.

📋 **Processing time:** 15–30 working days after document verification.

---
*Source: Municipal Building Regulations Guide, 2023 Edition · Chapter 4, Section 4.2*

⚠ *This is general guidance only. Current requirements may differ. Please verify with the Town Planning Department before submitting your application.*`,
    timestamp: '10:02 AM',
  },
  {
    id: 'u2',
    role: 'user',
    text: 'What documents do I need for a water connection?',
    timestamp: '10:04 AM',
  },
  {
    id: 'a2',
    role: 'ai',
    text: `To apply for a **New Water Connection** in Vanguard City, you will need:

**Required Documents:**
• Identity proof — Aadhaar Card, Voter ID, or Passport (self-attested copy)
• Property ownership document — sale deed, title deed, or registered lease agreement
• Site plan / location sketch showing the plot and proposed inlet point
• Completed **WC-02 Application Form** (available at the Water Supply Department, Counter 5)
• No Objection Certificate (NOC) from the housing society (for apartment applications)

**Fees:**
• Domestic connection: ₹1,200 (includes meter installation)
• Commercial connection: ₹3,500 onwards

**Processing Time:** 15–20 working days from the date of document verification.

📍 Submit at the **Water Supply Department**, Second Floor, Municipal Complex.

---
*Source: Water Supply & Sewerage Regulations Manual · Section 2.1*

⚠ *This is general guidance. Verify current fee schedule and form numbers at the Water Supply Department before applying.*`,
    timestamp: '10:04 AM',
  },
]

const QUICK_QUESTIONS = [
  'How to get water connection?',
  'Building permit process',
  'How to track a complaint?',
  'Property tax payment',
]

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CivicAIPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: `u${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: formatTime(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/civic-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        const formattedAnswer = `${data.answer}\n\n---\n📋 **Source:** *${data.source}*\n\n⚠ *${data.disclaimer}*`

        const aiMsg: Message = {
          id: `a${Date.now()}`,
          role: 'ai',
          text: formattedAnswer,
          timestamp: formatTime(),
        }
        setMessages((prev) => [...prev, aiMsg])
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (err) {
      // Controlled fallback if backend is unreachable
      const aiMsg: Message = {
        id: `a${Date.now()}`,
        role: 'ai',
        text: `General Guidance:\nFor official municipal queries regarding "${text.trim()}", please visit the Vanguard City Municipal Administrative Center (Counters 1-6) or call the civic helpline at 1800-345-0000.\n\n⚠ *Please verify this information with the relevant municipal authority.*`,
        timestamp: formatTime(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex flex-col">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 px-4 py-8">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Civic AI Assistant</h1>
          <p className="text-sm text-slate-500">Ask questions about municipal services, processes, and regulations.</p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>⚠ Disclaimer:</strong> The Civic AI Assistant provides general guidance about municipal services.
            Always verify official procedures with the municipal office.
            AI responses are <strong>NOT</strong> official government communication.
          </p>
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-slate-600 rounded-full hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ minHeight: '420px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-slate-500">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex gap-2 items-end">
              {/* Mic button (non-functional) */}
              <div className="relative group">
                <button
                  disabled
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 cursor-not-allowed"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-700 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Coming soon
                </div>
              </div>

              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  placeholder="Ask about municipal services, permits, complaints…"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none leading-relaxed"
                  style={{ maxHeight: '120px' }}
                />
              </div>

              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chat Message ───────────────────────────────────────────────────────────
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Simple markdown-lite renderer (bold, bullet lists, hr, code)
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('---')) {
        return <hr key={i} className="border-gray-200 my-2" />
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold text-slate-800 mb-1">
            {line.replace(/\*\*/g, '')}
          </p>
        )
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 text-sm leading-relaxed">
            {formatInline(line.slice(2))}
          </li>
        )
      }
      if (/^\d+\./.test(line)) {
        return (
          <li key={i} className="ml-4 list-decimal text-slate-700 text-sm leading-relaxed">
            {formatInline(line.replace(/^\d+\.\s*/, ''))}
          </li>
        )
      }
      if (line.startsWith('📋') || line.startsWith('📍') || line.startsWith('🔧') || line.startsWith('⚠')) {
        return (
          <p key={i} className="text-sm text-slate-600 leading-relaxed mt-1 italic">
            {formatInline(line)}
          </p>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-1.5" />
      return (
        <p key={i} className="text-sm text-slate-700 leading-relaxed">
          {formatInline(line)}
        </p>
      )
    })
  }

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    )
  }

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%]">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3">
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 text-right">{message.timestamp}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-purple-600" />
      </div>
      <div className="max-w-[85%]">
        <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 space-y-0.5">
          {renderText(message.text)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{message.timestamp}</p>
      </div>
    </div>
  )
}
