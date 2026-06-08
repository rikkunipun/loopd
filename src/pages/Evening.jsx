import { useState, useEffect, useRef } from 'react'
import { Check, X, ArrowRight, Trash2, Moon, Smartphone, Clock } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useToday } from '../hooks/useToday'
import { useLogStore } from '../store/logStore'

// ── Config ─────────────────────────────────────────────────────────────────

const SKIP_REASONS = [
  'Ran out of time',
  'No energy',
  'Got distracted',
  "Wasn't important",
  'Forgot',
  'Task unclear',
  'Something came up',
]

const PRIORITY_STYLE = {
  must:    { background: 'rgba(239,68,68,0.10)',   color: '#dc2626' },
  should:  { background: 'rgba(245,158,11,0.10)',  color: '#d97706' },
  someday: { background: 'rgba(100,116,139,0.10)', color: '#64748b' },
}

const TYPE_STYLE = {
  deep_work: { background: 'rgba(91,91,214,0.10)',   color: '#5b5bd6' },
  quick:     { background: 'rgba(16,185,129,0.10)',  color: '#059669' },
  admin:     { background: 'rgba(100,116,139,0.10)', color: '#64748b' },
}

const TYPE_LABEL = { deep_work: 'Deep work', quick: 'Quick', admin: 'Admin' }

const CARD = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 2px 12px rgba(91,91,214,0.06)',
  borderRadius: '16px',
}

const CARD_DONE = {
  ...CARD,
  background: 'rgba(16,185,129,0.07)',
  border: '1px solid rgba(16,185,129,0.20)',
  boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
}

const CARD_SKIPPED = {
  ...CARD,
  background: 'rgba(0,0,0,0.03)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: 'none',
}

const CARD_CARRIED = {
  ...CARD,
  background: 'rgba(245,158,11,0.06)',
  border: '1px solid rgba(245,158,11,0.18)',
  boxShadow: '0 2px 8px rgba(245,158,11,0.06)',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function getTaskState(task) {
  if (task.completed) return 'done'
  if (task.skipped) return 'skipped'
  if (task.planned_date > getTodayDate()) return 'carried'
  return 'pending'
}

function Badge({ style, children }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium"
      style={style}
    >
      {children}
    </span>
  )
}

function SectionHeader({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

function NumberInput({ label, hint, value, onChange, icon: Icon }) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={13} color="#94a3b8" strokeWidth={2} />}
        <label className="text-xs font-medium text-slate-500">{label}</label>
      </div>
      <input
        type="number"
        min="0"
        max="24"
        step="0.5"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="—"
        className="w-full text-center text-sm font-semibold rounded-xl py-2.5 outline-none"
        style={{
          background: 'rgba(241,245,249,0.8)',
          border: '1px solid rgba(91,91,214,0.15)',
          color: '#1e293b',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      />
      {hint && <p className="text-xs text-slate-300 mt-1 text-center">{hint}</p>}
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Evening() {
  const { todayLog, updateTodayLog } = useLogStore()
  const { upsertLog } = useToday()
  const { tasks, completeTask, skipTask, carryTask, deleteTask } = useTasks()

  const [pending, setPending] = useState({})
  const [showSkipFor, setShowSkipFor] = useState(null)

  // Screen time + sleep local display state (in hours)
  const [screenVals, setScreenVals] = useState({ social: '', productive: '', total: '' })
  const [sleepVal, setSleepVal] = useState('')
  const debounceRef = useRef({})
  const initialized = useRef(false)

  // Initialise number inputs once when the real DB row loads
  useEffect(() => {
    if (!todayLog?.id || initialized.current) return
    initialized.current = true
    setScreenVals({
      social:     todayLog.screen_social_mins     ? String(todayLog.screen_social_mins / 60)     : '',
      productive: todayLog.screen_productive_mins ? String(todayLog.screen_productive_mins / 60) : '',
      total:      todayLog.screen_total_mins      ? String(todayLog.screen_total_mins / 60)      : '',
    })
    setSleepVal(todayLog.sleep_hours ? String(todayLog.sleep_hours) : '')
  }, [todayLog?.id])

  // ── Pending helpers ──

  function startPending(id) { setPending(p => ({ ...p, [id]: true })) }
  function endPending(id)   { setPending(p => { const n = { ...p }; delete n[id]; return n }) }

  // ── Task actions ──

  async function handleDone(taskId) {
    startPending(taskId)
    setShowSkipFor(null)
    await completeTask(taskId)
    endPending(taskId)
  }

  async function handleSkipReason(taskId, reason) {
    startPending(taskId)
    await skipTask(taskId, reason)
    setShowSkipFor(null)
    endPending(taskId)
  }

  async function handleCarry(task) {
    startPending(task.id)
    setShowSkipFor(null)
    await carryTask(task.id, task.carry_count)
    endPending(task.id)
  }

  async function handleDelete(taskId) {
    startPending(taskId)
    setShowSkipFor(null)
    await deleteTask(taskId)
    endPending(taskId)
  }

  // ── Debounced log saves ──

  function debounceLog(field, value) {
    updateTodayLog({ [field]: value })
    clearTimeout(debounceRef.current[field])
    debounceRef.current[field] = setTimeout(() => {
      upsertLog({ [field]: value })
    }, 800)
  }

  function handleScreenChange(key, fieldName, rawVal) {
    const hrs = parseFloat(rawVal)
    const mins = !isNaN(hrs) && hrs >= 0 ? Math.round(hrs * 60) : null
    setScreenVals(prev => ({ ...prev, [key]: rawVal }))
    debounceLog(fieldName, mins)
  }

  function handleSleepChange(rawVal) {
    const hrs = parseFloat(rawVal)
    const value = !isNaN(hrs) && hrs >= 0 ? hrs : null
    setSleepVal(rawVal)
    debounceLog('sleep_hours', value)
  }

  // ── Derived ──

  const doneTasks  = tasks.filter(t => t.completed)
  const totalTasks = tasks.length

  return (
    <div
      className="min-h-screen px-4 pt-10 pb-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Decorative blob */}
      <div
        className="fixed top-0 right-0 w-80 h-80 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,91,214,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
          Review your day
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Evening</h1>
      </div>

      {/* ── Task Review ─────────────────────────────────────────── */}
      <section className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Tasks</SectionHeader>
          <span className="text-xs text-slate-400 mb-3">
            {doneTasks.length}/{totalTasks} done
          </span>
        </div>

        {tasks.length === 0 ? (
          <div style={CARD} className="px-4 py-5 text-center">
            <p className="text-sm text-slate-400">No tasks planned for today.</p>
            <p className="text-xs text-slate-300 mt-1">Plan tomorrow in the Morning tab.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => {
              const state = getTaskState(task)
              const cardStyle = state === 'done'    ? CARD_DONE
                              : state === 'skipped' ? CARD_SKIPPED
                              : state === 'carried' ? CARD_CARRIED
                              : CARD
              const isLoading = !!pending[task.id]

              return (
                <div key={task.id} style={{ ...cardStyle, opacity: state === 'skipped' ? 0.65 : 1 }}>

                  {/* ── Carry warning ── */}
                  {task.carry_count >= 3 && state === 'pending' && (
                    <div
                      className="mx-3 mt-3 mb-0 px-3 py-2 rounded-xl flex items-center justify-between"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)' }}
                    >
                      <span className="text-xs text-amber-700 font-medium">
                        ⚠️ Carried {task.carry_count}× — is this actually important?
                      </span>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-xs font-semibold ml-3 flex-shrink-0"
                        style={{ color: '#ef4444' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <div className="px-4 py-3">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-snug"
                          style={{
                            color: state === 'done' ? '#059669' : state === 'skipped' ? '#94a3b8' : '#1e293b',
                            textDecoration: state === 'skipped' ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge style={PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.should}>
                            {task.priority}
                          </Badge>
                          <Badge style={TYPE_STYLE[task.task_type] || TYPE_STYLE.quick}>
                            {TYPE_LABEL[task.task_type] || task.task_type}
                          </Badge>
                          {task.carry_count > 0 && (
                            <Badge style={{ background: 'rgba(245,158,11,0.10)', color: '#d97706' }}>
                              Carried {task.carry_count}×
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* State indicator (done/skipped/carried) */}
                      {state === 'done' && (
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                          style={{ background: 'rgba(16,185,129,0.15)' }}
                        >
                          <Check size={13} color="#059669" strokeWidth={3} />
                        </div>
                      )}
                      {state === 'carried' && (
                        <span className="flex-shrink-0 text-xs font-medium mt-0.5" style={{ color: '#d97706' }}>
                          → Tomorrow
                        </span>
                      )}
                    </div>

                    {/* Skip reason label */}
                    {state === 'skipped' && task.skip_reason && (
                      <p className="text-xs text-slate-400 mt-1 mb-1">
                        Reason: {task.skip_reason}
                      </p>
                    )}

                    {/* Action buttons — only for pending tasks */}
                    {state === 'pending' && (
                      <>
                        {isLoading ? (
                          <div className="flex justify-center py-1">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                              style={{ borderColor: 'rgba(91,91,214,0.25)', borderTopColor: '#5b5bd6' }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            {/* Done */}
                            <button
                              onClick={() => handleDone(task.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                              style={{ background: 'rgba(16,185,129,0.10)', color: '#059669' }}
                            >
                              <Check size={13} strokeWidth={2.5} />
                              Done
                            </button>

                            {/* Skip */}
                            <button
                              onClick={() => setShowSkipFor(
                                showSkipFor === task.id ? null : task.id
                              )}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                              style={{
                                background: showSkipFor === task.id
                                  ? 'rgba(239,68,68,0.12)'
                                  : 'rgba(239,68,68,0.07)',
                                color: '#ef4444',
                              }}
                            >
                              <X size={13} strokeWidth={2.5} />
                              Skip
                            </button>

                            {/* Carry */}
                            <button
                              onClick={() => handleCarry(task)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                              style={{ background: 'rgba(245,158,11,0.10)', color: '#d97706' }}
                            >
                              <ArrowRight size={13} strokeWidth={2.5} />
                              Carry
                            </button>
                          </div>
                        )}

                        {/* Skip reason picker — inline, no modal */}
                        {showSkipFor === task.id && !isLoading && (
                          <div
                            className="mt-2 p-3 rounded-xl"
                            style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
                          >
                            <p className="text-xs font-medium text-slate-500 mb-2">Why skip?</p>
                            <div className="flex flex-wrap gap-1.5">
                              {SKIP_REASONS.map(reason => (
                                <button
                                  key={reason}
                                  onClick={() => handleSkipReason(task.id, reason)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
                                  style={{
                                    background: 'rgba(255,255,255,0.80)',
                                    color: '#64748b',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                  }}
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Completion summary */}
        {tasks.length > 0 && (
          <div
            className="mt-3 px-4 py-3 rounded-2xl flex items-center justify-between"
            style={{
              background: doneTasks.length === totalTasks
                ? 'rgba(16,185,129,0.09)'
                : 'rgba(91,91,214,0.06)',
              border: doneTasks.length === totalTasks
                ? '1px solid rgba(16,185,129,0.20)'
                : '1px solid rgba(91,91,214,0.12)',
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: doneTasks.length === totalTasks ? '#059669' : '#5b5bd6' }}
            >
              {doneTasks.length === totalTasks
                ? '🎉 All tasks done!'
                : `${doneTasks.length} of ${totalTasks} tasks done`}
            </p>
            <p className="text-xs text-slate-400">
              {tasks.filter(t => t.skipped).length > 0 &&
                `${tasks.filter(t => t.skipped).length} skipped`}
            </p>
          </div>
        )}
      </section>

      {/* ── Screen Time ─────────────────────────────────────────── */}
      <section className="mb-7">
        <SectionHeader>Screen time</SectionHeader>
        <div style={CARD} className="p-4">
          <div className="flex gap-3">
            <NumberInput
              label="Social"
              icon={Smartphone}
              value={screenVals.social}
              onChange={v => handleScreenChange('social', 'screen_social_mins', v)}
            />
            <NumberInput
              label="Productive"
              icon={Clock}
              value={screenVals.productive}
              onChange={v => handleScreenChange('productive', 'screen_productive_mins', v)}
            />
            <NumberInput
              label="Total"
              value={screenVals.total}
              onChange={v => handleScreenChange('total', 'screen_total_mins', v)}
            />
          </div>
          <p className="text-xs text-slate-300 mt-3 text-center">
            iPhone Settings → Screen Time to check
          </p>
        </div>
      </section>

      {/* ── Sleep ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader>Last night's sleep</SectionHeader>
        <div style={CARD} className="p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(91,91,214,0.10)' }}
            >
              <Moon size={18} color="#5b5bd6" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="16"
                  step="0.5"
                  value={sleepVal}
                  onChange={e => handleSleepChange(e.target.value)}
                  placeholder="0"
                  className="w-20 text-center text-base font-bold rounded-xl py-2 outline-none"
                  style={{
                    background: 'rgba(241,245,249,0.8)',
                    border: '1px solid rgba(91,91,214,0.15)',
                    color: '#1e293b',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                />
                <span className="text-sm font-medium text-slate-500">hours</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">How long did you sleep last night?</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
