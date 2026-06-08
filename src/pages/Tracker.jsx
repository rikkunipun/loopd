import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useHabits } from '../hooks/useHabits'
import { useToday } from '../hooks/useToday'
import { useLogStore } from '../store/logStore'
import { calculateDayScore } from '../lib/utils'
import HabitCard from '../components/HabitCard'
import DayScore from '../components/DayScore'
import ManageHabits from '../components/ManageHabits'
import MoodPicker from '../components/MoodPicker'
import QuestionCard from '../components/QuestionCard'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

// ── Question data ──────────────────────────────────────────────────────────

const DAILY_QUESTIONS = [
  {
    question: 'Did I move toward my main goal?',
    field: 'q_goal_progress',
    options: [
      { label: '❌ Not at all', val: 0 },
      { label: '🤏 A little',   val: 1 },
      { label: '✅ Yes',        val: 2 },
      { label: '🔥 Crushed it', val: 3 },
    ],
  },
  {
    question: 'Did I waste time?',
    field: 'q_time_wasted',
    options: [
      { label: 'Nope',  val: 0 },
      { label: 'A bit', val: 1 },
      { label: 'Yeah',  val: 2 },
      { label: 'Badly', val: 3 },
    ],
  },
  {
    question: 'Energy today?',
    field: 'q_energy',
    options: [
      { label: '💀 Drained', val: 0 },
      { label: '😑 Low',     val: 1 },
      { label: '⚡ Okay',    val: 2 },
      { label: '🚀 High',    val: 3 },
    ],
  },
  {
    question: 'Avoided distractions?',
    field: 'q_distractions',
    options: [
      { label: '❌',  val: 0 },
      { label: '🤏',  val: 1 },
      { label: '✅',  val: 2 },
      { label: '🔥',  val: 3 },
    ],
  },
]

const JOURNAL_PROMPTS = [
  {
    question: 'What blocked focus?',
    field: 'q_focus_blocker',
    options: ['Phone', 'No clear task', 'Low energy', 'Stress', 'Nothing']
      .map(v => ({ label: v, val: v })),
  },
  {
    question: 'Best work time?',
    field: 'q_best_work_time',
    options: ['Early morning', 'Late morning', 'Afternoon', 'Night', "Didn't happen"]
      .map(v => ({ label: v, val: v })),
  },
  {
    question: 'Today was a _____ day',
    field: 'q_day_word',
    options: ['Productive', 'Sluggish', 'Anxious', 'Focused', 'Scattered', 'Balanced']
      .map(v => ({ label: v, val: v })),
  },
  {
    question: 'Tomorrow needs?',
    field: 'q_tomorrow_needs',
    options: ['Early start', 'Rest', 'Deep work', 'Social energy', 'Movement']
      .map(v => ({ label: v, val: v })),
  },
]

// ── Shared section card style ──────────────────────────────────────────────

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(255,255,255,0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 2px 12px rgba(91,91,214,0.06)',
  borderRadius: '16px',
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Tracker() {
  const { todayLog, updateTodayLog } = useLogStore()
  const {
    habits,
    allHabits,
    completions,
    completedCount,
    loading,
    toggleHabit,
    getStreak,
    toggleHabitActive,
    deleteHabit,
    addCustomHabit,
  } = useHabits()

  const { upsertLog } = useToday()

  const [pending, setPending] = useState(null)
  const [showManage, setShowManage] = useState(false)

  const goalProgress = todayLog?.q_goal_progress ?? 0
  const dayScore = calculateDayScore(completedCount, habits.length, goalProgress)

  function isCompleted(habitId) {
    return completions.some(c => c.habit_id === habitId && c.completed)
  }

  async function handleToggle(habitId) {
    setPending(habitId)
    await toggleHabit(habitId)
    setPending(null)
  }

  // Optimistic save: update store immediately, persist to Supabase in background
  function saveLog(field, value) {
    updateTodayLog({ [field]: value })
    upsertLog({ [field]: value })
  }

  return (
    <div
      className="min-h-screen px-4 pt-10 pb-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-0 right-0 w-80 h-80 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,91,214,0.10) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="fixed bottom-24 left-0 w-64 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Page header */}
      <div className="mb-5 relative">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
          {formatDate()}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Today</h1>
      </div>

      {/* Day score banner */}
      <DayScore score={dayScore} completed={completedCount} total={habits.length} />

      {/* ── Habits ──────────────────────────────────────────────── */}
      <section className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Habits
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400">
              {completedCount}/{habits.length} done
            </span>
            <button
              onClick={() => setShowManage(v => !v)}
              className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 transition-colors"
              style={{
                color: showManage ? '#5b5bd6' : '#64748b',
                background: showManage ? 'rgba(91,91,214,0.08)' : 'rgba(0,0,0,0.04)',
              }}
            >
              <Settings2 size={12} strokeWidth={2} />
              Manage
            </button>
          </div>
        </div>

        {showManage && (
          <ManageHabits
            allHabits={allHabits}
            onToggleActive={toggleHabitActive}
            onDelete={deleteHabit}
            onAdd={addCustomHabit}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <p className="text-sm text-slate-400">No active habits.</p>
            <p className="text-xs text-slate-300 mt-1">Tap Manage to activate or add habits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted(habit.id)}
                streak={getStreak(habit.id)}
                loading={pending === habit.id}
                onToggle={() => handleToggle(habit.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Mood ────────────────────────────────────────────────── */}
      <MoodPicker todayLog={todayLog} onSave={saveLog} />

      {/* ── Daily Questions ─────────────────────────────────────── */}
      <section className="mt-7">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Daily Check-in
        </h2>
        <div style={CARD_STYLE} className="p-4 flex flex-col gap-5">
          {DAILY_QUESTIONS.map(({ question, field, options }) => (
            <QuestionCard
              key={field}
              question={question}
              options={options}
              value={todayLog?.[field] ?? null}
              onSelect={val => saveLog(field, val)}
            />
          ))}
        </div>
      </section>

      {/* ── Journal Prompts ─────────────────────────────────────── */}
      <section className="mt-7">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Journal
        </h2>
        <div style={CARD_STYLE} className="p-4 flex flex-col gap-5">
          {JOURNAL_PROMPTS.map(({ question, field, options }) => (
            <QuestionCard
              key={field}
              question={question}
              options={options}
              value={todayLog?.[field] ?? null}
              onSelect={val => saveLog(field, val)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
