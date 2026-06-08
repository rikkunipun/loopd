import { useState } from 'react'
import {
  Dumbbell, Brain, Salad, Droplets, Moon, Ban, Pencil, Star, Trash2, Plus,
} from 'lucide-react'

const ICONS = { Dumbbell, Brain, Salad, Droplets, Moon, Ban, Pencil, Star }

function HabitIcon({ name, size = 15, color }) {
  const Icon = ICONS[name] || Star
  return <Icon size={size} color={color} strokeWidth={2} />
}

function Toggle({ on, onToggle, disabled }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={on ? 'Deactivate habit' : 'Activate habit'}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        width: '40px',
        height: '22px',
        background: on ? '#5b5bd6' : '#cbd5e1',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        className="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          top: '2px',
          width: '18px',
          height: '18px',
          transform: on ? 'translateX(20px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}

export default function ManageHabits({ allHabits, onToggleActive, onDelete, onAdd }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    await onAdd(newName)
    setNewName('')
    setAdding(false)
  }

  async function handleToggle(habitId, newActive) {
    setToggling(habitId)
    await onToggleActive(habitId, newActive)
    setToggling(null)
  }

  async function handleDelete(habitId) {
    setDeleting(habitId)
    const ok = await onDelete(habitId)
    // Only clear deleting state after confirmed — if it failed, button stays
    // disabled briefly then resets so the user sees something happened
    if (!ok) setTimeout(() => setDeleting(null), 800)
    else setDeleting(null)
  }

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(91,91,214,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 2px 16px rgba(91,91,214,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(91,91,214,0.08)' }}
      >
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Manage habits
        </p>
      </div>

      {/* Habit rows */}
      <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        {allHabits.length === 0 && (
          <p className="px-4 py-4 text-sm text-slate-400 text-center">No habits yet</p>
        )}
        {allHabits.map(habit => (
          <div
            key={habit.id}
            className="flex items-center gap-3 px-4 py-3"
            style={{ opacity: habit.is_active ? 1 : 0.55 }}
          >
            {/* Icon */}
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: habit.is_active ? 'rgba(91,91,214,0.1)' : 'rgba(0,0,0,0.04)' }}
            >
              <HabitIcon
                name={habit.icon}
                color={habit.is_active ? '#5b5bd6' : '#94a3b8'}
              />
            </div>

            {/* Name */}
            <span
              className="flex-1 text-sm font-medium truncate"
              style={{ color: habit.is_active ? '#1e293b' : '#94a3b8' }}
            >
              {habit.name}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Toggle
                on={habit.is_active}
                onToggle={() => handleToggle(habit.id, !habit.is_active)}
                disabled={toggling === habit.id}
              />
              <button
                type="button"
                onClick={() => handleDelete(habit.id)}
                disabled={deleting === habit.id}
                aria-label="Delete habit"
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                {deleting === habit.id
                  ? <div className="w-3.5 h-3.5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: '#94a3b8', borderTopColor: 'transparent' }} />
                  : <Trash2 size={14} strokeWidth={2} />
                }
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new habit */}
      <form
        onSubmit={handleAdd}
        className="flex gap-2 px-4 py-3 border-t"
        style={{ borderColor: 'rgba(0,0,0,0.05)' }}
      >
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Add a habit…"
          maxLength={40}
          className="flex-1 text-sm rounded-xl px-3 py-2 outline-none"
          style={{
            background: 'rgba(241,245,249,0.8)',
            border: '1px solid rgba(91,91,214,0.15)',
            color: '#1e293b',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-opacity"
          style={{
            background: '#5b5bd6',
            color: '#fff',
            opacity: adding || !newName.trim() ? 0.5 : 1,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          {adding
            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Plus size={14} strokeWidth={2.5} />
          }
          Add
        </button>
      </form>
    </div>
  )
}
