import { useState, useEffect } from 'react'
import { Plus, Star, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useToday } from '../hooks/useToday'
import { useLogStore } from '../store/logStore'
import { getTodayDate } from '../lib/utils'

// ── Config ─────────────────────────────────────────────────────────────────

const CONTEXT_TAGS = ['College day', 'Home day', 'Travel', 'Exam week', 'Holiday']

const PRIORITIES = [
  { label: 'Must',    val: 'must'    },
  { label: 'Should',  val: 'should'  },
  { label: 'Someday', val: 'someday' },
]

const TASK_TYPES = [
  { label: 'Deep work', val: 'deep_work' },
  { label: 'Quick',     val: 'quick'     },
  { label: 'Admin',     val: 'admin'     },
]

const TIME_OPTIONS = [
  { label: '15 min', val: 15  },
  { label: '30 min', val: 30  },
  { label: '1 hr',   val: 60  },
  { label: '2 hrs',  val: 120 },
]

const PRIORITY_STYLE = {
  must:    { background: 'rgba(239,68,68,0.10)',   color: '#dc2626' },
  should:  { background: 'rgba(245,158,11,0.10)',  color: '#d97706' },
  someday: { background: 'rgba(100,116,139,0.10)', color: '#64748b' },
}

const TYPE_STYLE = {
  deep_work: { background: 'rgba(91,91,214,0.10)',  color: '#5b5bd6' },
  quick:     { background: 'rgba(16,185,129,0.10)', color: '#059669' },
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

// ── Shared UI helpers ──────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

function PillSelector({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ label, val }) => {
        const selected = value === val
        return (
          <button
            key={String(val)}
            type="button"
            onClick={() => onChange(val)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
            style={{
              background: selected ? '#5b5bd6' : 'rgba(255,255,255,0.75)',
              color: selected ? '#fff' : '#475569',
              border: selected ? '1px solid transparent' : '1px solid rgba(0,0,0,0.07)',
              boxShadow: selected ? '0 2px 8px rgba(91,91,214,0.25)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
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

// ── Component ──────────────────────────────────────────────────────────────

export default function Morning() {
  const { todayLog, updateTodayLog } = useLogStore()
  const { upsertLog } = useToday()
  const { tasks, fetchCarriedTasks, createTask, deleteTask, moveCarriedToToday } = useTasks()

  // Carried tasks (pre-today, incomplete)
  const [carriedTasks, setCarriedTasks] = useState([])
  const [carriedLoading, setCarriedLoading] = useState(true)
  const [actionPending, setActionPending] = useState(null)

  // Add-task form
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('should')
  const [taskType, setTaskType] = useState('quick')
  const [estimatedMins, setEstimatedMins] = useState(null)
  const [adding, setAdding] = useState(false)

  // Priority task — persisted per day in localStorage
  const [priorityTaskId, setPriorityTaskId] = useState(() => {
    try {
      return localStorage.getItem(`priority_task_${getTodayDate()}`) || null
    } catch { return null }
  })

  useEffect(() => {
    loadCarried()
  }, [])

  async function loadCarried() {
    setCarriedLoading(true)
    const data = await fetchCarriedTasks()
    setCarriedTasks(data)
    setCarriedLoading(false)
  }

  // Context tag
  function saveContextTag(tag) {
    updateTodayLog({ context_tag: tag })
    upsertLog({ context_tag: tag })
  }

  // Carried task actions
  async function handleKeepToday(taskId) {
    setActionPending(taskId)
    await moveCarriedToToday(taskId)
    setCarriedTasks(prev => prev.filter(t => t.id !== taskId))
    setActionPending(null)
  }

  async function handleDeleteCarried(taskId) {
    setActionPending(taskId)
    await deleteTask(taskId)
    setCarriedTasks(prev => prev.filter(t => t.id !== taskId))
    setActionPending(null)
  }

  // Add task
  async function handleAddTask(e) {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    await createTask({
      title: title.trim(),
      priority,
      task_type: taskType,
      estimated_mins: estimatedMins,
    })
    setTitle('')
    setEstimatedMins(null)
    setAdding(false)
  }

  // Priority task
  function togglePriorityTask(taskId) {
    const newId = priorityTaskId === taskId ? null : taskId
    setPriorityTaskId(newId)
    try {
      if (newId) localStorage.setItem(`priority_task_${getTodayDate()}`, newId)
      else localStorage.removeItem(`priority_task_${getTodayDate()}`)
    } catch { /* ignore */ }
  }

  const todayTasks = tasks.filter(t => !t.completed && !t.skipped)

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
          Plan your day
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Morning</h1>
      </div>

      {/* ── Context Tag ─────────────────────────────────────────── */}
      <section className="mb-7">
        <SectionHeader>Today is a…</SectionHeader>
        <div style={CARD} className="p-4">
          <PillSelector
            options={CONTEXT_TAGS.map(t => ({ label: t, val: t }))}
            value={todayLog?.context_tag ?? null}
            onChange={saveContextTag}
          />
        </div>
      </section>

      {/* ── Carried Tasks ────────────────────────────────────────── */}
      <section className="mb-7">
        <SectionHeader>Carried from before</SectionHeader>

        {carriedLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        ) : carriedTasks.length === 0 ? (
          <div
            style={CARD}
            className="px-4 py-3 flex items-center gap-2"
          >
            <CheckCircle2 size={16} color="#10b981" strokeWidth={2} />
            <p className="text-sm text-slate-500">All clear from yesterday.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {carriedTasks.map(task => {
              const isPending = actionPending === task.id
              return (
                <div
                  key={task.id}
                  style={CARD}
                  className="px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Title + badges */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate mb-1.5">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge style={PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.should}>
                          {task.priority}
                        </Badge>
                        <Badge style={TYPE_STYLE[task.task_type] || TYPE_STYLE.quick}>
                          {TYPE_LABEL[task.task_type] || task.task_type}
                        </Badge>
                        {task.carry_count > 0 && (
                          <Badge style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                            Carried {task.carry_count}×
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      {isPending ? (
                        <div
                          className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'rgba(91,91,214,0.3)', borderTopColor: '#5b5bd6' }}
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => handleKeepToday(task.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                            style={{ background: 'rgba(91,91,214,0.08)', color: '#5b5bd6' }}
                          >
                            <ArrowRight size={12} strokeWidth={2.5} />
                            Keep today
                          </button>
                          <button
                            onClick={() => handleDeleteCarried(task.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-xl transition-colors"
                            style={{ color: '#94a3b8' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                            aria-label="Delete task"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Add Task ─────────────────────────────────────────────── */}
      <section className="mb-7">
        <SectionHeader>Add task</SectionHeader>
        <form onSubmit={handleAddTask} style={CARD} className="p-4 flex flex-col gap-4">

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to get done?"
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{
              background: 'rgba(241,245,249,0.8)',
              border: '1px solid rgba(91,91,214,0.15)',
              color: '#1e293b',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />

          {/* Priority */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Priority</p>
            <PillSelector options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>

          {/* Type */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Type</p>
            <PillSelector options={TASK_TYPES} value={taskType} onChange={setTaskType} />
          </div>

          {/* Estimated time */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Estimated time</p>
            <PillSelector options={TIME_OPTIONS} value={estimatedMins} onChange={val => setEstimatedMins(v => v === val ? null : val)} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={adding || !title.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-98"
            style={{
              background: '#5b5bd6',
              color: '#fff',
              opacity: adding || !title.trim() ? 0.5 : 1,
              boxShadow: '0 2px 12px rgba(91,91,214,0.30)',
              fontFamily: "'Inter', system-ui, sans-serif",
              cursor: adding || !title.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {adding
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Plus size={15} strokeWidth={2.5} />
            }
            Add task
          </button>
        </form>
      </section>

      {/* ── Today's Tasks ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader>Today's tasks</SectionHeader>
          <span className="text-xs text-slate-400 mb-3">{todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''}</span>
        </div>

        {todayTasks.length === 0 ? (
          <div
            style={CARD}
            className="px-4 py-5 text-center"
          >
            <p className="text-sm text-slate-400">No tasks planned yet.</p>
            <p className="text-xs text-slate-300 mt-1">Add one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(task => {
              const isPriority = priorityTaskId === task.id
              return (
                <div
                  key={task.id}
                  className="px-4 py-3 transition-all duration-150"
                  style={{
                    ...CARD,
                    border: isPriority
                      ? '1px solid rgba(91,91,214,0.35)'
                      : CARD.border,
                    background: isPriority
                      ? 'rgba(91,91,214,0.05)'
                      : CARD.background,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Priority star */}
                    <button
                      onClick={() => togglePriorityTask(task.id)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-90"
                      style={{
                        color: isPriority ? '#5b5bd6' : '#cbd5e1',
                        background: isPriority ? 'rgba(91,91,214,0.1)' : 'transparent',
                      }}
                      aria-label={isPriority ? 'Remove priority' : 'Set as priority'}
                    >
                      <Star
                        size={14}
                        strokeWidth={2}
                        fill={isPriority ? '#5b5bd6' : 'none'}
                      />
                    </button>

                    {/* Title + badges */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: isPriority ? '#1e293b' : '#334155' }}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge style={PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.should}>
                          {task.priority}
                        </Badge>
                        <Badge style={TYPE_STYLE[task.task_type] || TYPE_STYLE.quick}>
                          {TYPE_LABEL[task.task_type] || task.task_type}
                        </Badge>
                        {task.estimated_mins && (
                          <Badge style={{ background: 'rgba(100,116,139,0.08)', color: '#94a3b8' }}>
                            {task.estimated_mins < 60
                              ? `${task.estimated_mins}m`
                              : `${task.estimated_mins / 60}h`}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isPriority && (
                      <span
                        className="text-xs font-semibold flex-shrink-0"
                        style={{ color: '#5b5bd6' }}
                      >
                        Priority
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
