import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Zap, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getDailyPulse } from '../lib/openai'
import { useAuthStore } from '../store/authStore'
import { useToday } from '../hooks/useToday'
import { getTodayDate } from '../lib/utils'

// ── Score helpers ───────────────────────────────────────────────────────────

function scoreColor(s) {
  if (s >= 8) return '#059669'
  if (s >= 6) return '#5b5bd6'
  if (s >= 4) return '#d97706'
  return '#dc2626'
}

function scoreBg(s) {
  if (s >= 8) return 'rgba(16,185,129,0.10)'
  if (s >= 6) return 'rgba(91,91,214,0.10)'
  if (s >= 4) return 'rgba(245,158,11,0.10)'
  return 'rgba(239,68,68,0.10)'
}

function scoreLabel(s) {
  if (s >= 8) return 'Excellent day'
  if (s >= 6) return 'Good day'
  if (s >= 4) return 'Okay day'
  return 'Rough day'
}

function formatScore(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1)
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PulseSkeleton({ generating }) {
  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(91,91,214,0.14)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(91,91,214,0.10), 0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {generating && (
        <div className="flex items-center gap-2 mb-5">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: 'rgba(91,91,214,0.25)', borderTopColor: '#5b5bd6' }} />
          <p className="text-xs font-medium text-slate-400">Generating your pulse…</p>
        </div>
      )}

      {/* Score block skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-2xl animate-pulse flex-shrink-0"
             style={{ background: 'rgba(91,91,214,0.07)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded-lg animate-pulse"
               style={{ background: 'rgba(91,91,214,0.08)' }} />
          <div className="h-5 w-40 rounded-lg animate-pulse"
               style={{ background: 'rgba(0,0,0,0.06)' }} />
        </div>
      </div>

      {/* Body skeleton */}
      <div className="space-y-2.5 mb-6">
        {[90, 80, 65].map(w => (
          <div key={w} className="h-3.5 rounded-lg animate-pulse"
               style={{ background: 'rgba(0,0,0,0.05)', width: `${w}%` }} />
        ))}
      </div>

      {/* Tomorrow box skeleton */}
      <div className="h-16 rounded-2xl animate-pulse"
           style={{ background: 'rgba(91,91,214,0.06)' }} />
    </div>
  )
}

function PulseCard({ pulse, daysOfData }) {
  const color = scoreColor(pulse.score)
  const bg    = scoreBg(pulse.score)

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: 'rgba(255,255,255,0.82)',
        border: `1px solid rgba(91,91,214,0.16)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(91,91,214,0.10), 0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Score + headline */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="flex-shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
          style={{ background: bg }}
        >
          <span
            style={{
              fontSize: '38px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-2px',
              color,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {formatScore(pulse.score)}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color,
              opacity: 0.65,
              marginTop: '2px',
              letterSpacing: '0.02em',
            }}
          >
            out of 10
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color, opacity: 0.85 }}
          >
            {scoreLabel(pulse.score)}
          </p>
          <h2
            className="text-lg font-bold text-slate-900 leading-tight"
            style={{ letterSpacing: '-0.3px' }}
          >
            {pulse.headline}
          </h2>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-5" style={{ height: '1px', background: 'rgba(0,0,0,0.06)' }} />

      {/* Body */}
      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        {pulse.body}
      </p>

      {/* Tomorrow suggestion */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'rgba(91,91,214,0.06)',
          border: '1px solid rgba(91,91,214,0.14)',
        }}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <ArrowRight size={12} color="#5b5bd6" strokeWidth={2.5} />
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#5b5bd6' }}
          >
            Tomorrow
          </p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {pulse.tomorrow}
        </p>
      </div>

      {/* Meta */}
      <p className="text-xs text-slate-300 mt-4 text-center">
        Based on {daysOfData} day{daysOfData !== 1 ? 's' : ''} of data
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="rounded-3xl p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(91,91,214,0.10)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(91,91,214,0.07)',
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(91,91,214,0.08)' }}
      >
        <Zap size={24} color="#5b5bd6" strokeWidth={2} />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-2">
        Nothing to pulse yet
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed">
        Complete your tracker first — log habits, mood, and check-in questions.
        Come back tonight for your daily pulse.
      </p>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatDate() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export default function Pulse() {
  const { user } = useAuthStore()
  const { } = useToday() // ensures todayLog + allLogs are populated in store

  const [status, setStatus]       = useState('loading') // loading | generating | ready | empty | error
  const [pulse, setPulse]         = useState(null)
  const [daysOfData, setDaysOfData] = useState(0)
  const [insightId, setInsightId] = useState(null)
  const [errorMsg, setErrorMsg]   = useState('')

  const loadPulse = useCallback(async (forceRegenerate = false) => {
    if (!user) return
    setStatus(forceRegenerate ? 'generating' : 'loading')

    const today = getTodayDate()

    // Fetch all data in parallel
    const [logRes, completionsRes, habitsRes, countRes] = await Promise.all([
      supabase.from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle(),

      supabase.from('habit_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .eq('completed', true),

      supabase.from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true),

      supabase.from('daily_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ])

    const todayLog       = logRes.data
    const habitsCompleted = completionsRes.data?.length || 0
    const totalHabits    = habitsRes.data?.length || 0
    const days           = countRes.count || 0
    setDaysOfData(days)

    // Determine if user has logged anything meaningful today
    const hasData = !!(
      todayLog?.id ||
      habitsCompleted > 0
    )

    if (!hasData) {
      setStatus('empty')
      return
    }

    // Check cache (unless force-regenerating)
    if (!forceRegenerate) {
      const { data: cached } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('insight_date', today)
        .eq('insight_type', 'daily_pulse')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cached?.body) {
        try {
          const parsed = JSON.parse(cached.body)
          if (parsed?.score && parsed?.headline) {
            setPulse(parsed)
            setInsightId(cached.id)
            setStatus('ready')
            return
          }
        } catch { /* fall through to generate */ }
      }
    }

    // Call OpenAI
    setStatus('generating')
    try {
      const result = await getDailyPulse(
        todayLog || {},
        habitsCompleted,
        totalHabits,
        days,
      )

      // Persist to cache
      const payload = {
        user_id:      user.id,
        insight_date: today,
        insight_type: 'daily_pulse',
        title:        result.headline,
        body:         JSON.stringify(result),
        data_days_used: days,
      }

      if (insightId && forceRegenerate) {
        await supabase.from('ai_insights').update(payload).eq('id', insightId)
      } else {
        const { data: saved } = await supabase
          .from('ai_insights')
          .insert(payload)
          .select('id')
          .single()
        if (saved) setInsightId(saved.id)
      }

      setPulse(result)
      setStatus('ready')
    } catch (err) {
      console.error('[Pulse]', err)
      setErrorMsg(err.message || 'Something went wrong.')
      setStatus('error')
    }
  }, [user, insightId])

  useEffect(() => {
    loadPulse()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen px-4 pt-10 pb-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none"
           style={{
             background: 'radial-gradient(circle, rgba(91,91,214,0.12) 0%, transparent 65%)',
             borderRadius: '50%',
           }} />
      <div className="fixed bottom-16 left-0 w-72 h-72 pointer-events-none"
           style={{
             background: 'radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 70%)',
             borderRadius: '50%',
           }} />

      {/* Page header */}
      <div className="mb-7">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
          {formatDate()}
        </p>
        <div className="flex items-center gap-2">
          <Zap size={22} color="#5b5bd6" strokeWidth={2.5} fill="rgba(91,91,214,0.15)" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Pulse</h1>
        </div>
      </div>

      {/* ── Main content ── */}

      {(status === 'loading' || status === 'generating') && (
        <PulseSkeleton generating={status === 'generating'} />
      )}

      {status === 'empty' && <EmptyState />}

      {status === 'error' && (
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(239,68,68,0.15)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <p className="text-sm font-semibold text-red-500 mb-1">Couldn't generate pulse</p>
          <p className="text-xs text-slate-400 mb-4">{errorMsg}</p>
          <button
            onClick={() => loadPulse()}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#5b5bd6', color: '#fff' }}
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && pulse && (
        <>
          <PulseCard pulse={pulse} daysOfData={daysOfData} />

          {/* Regenerate button */}
          <button
            onClick={() => loadPulse(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all active:scale-98"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(91,91,214,0.12)',
              color: '#64748b',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            <RefreshCw size={14} strokeWidth={2} />
            Regenerate
          </button>
        </>
      )}
    </div>
  )
}
