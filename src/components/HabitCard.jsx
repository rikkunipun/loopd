import {
  Dumbbell, Brain, Salad, Droplets, Moon, Ban, Pencil,
  Star, Check,
} from 'lucide-react'

const ICONS = { Dumbbell, Brain, Salad, Droplets, Moon, Ban, Pencil }

export default function HabitCard({ habit, isCompleted, streak, loading, onToggle }) {
  const Icon = ICONS[habit.icon] || Star

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="relative w-full text-left rounded-2xl p-4 transition-all duration-200 active:scale-95 select-none outline-none"
      style={{
        background: isCompleted ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.42)',
        border: isCompleted
          ? '1px solid rgba(91,91,214,0.22)'
          : '1px solid rgba(0,0,0,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isCompleted
          ? '0 2px 12px rgba(91,91,214,0.08)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Done checkmark */}
      {isCompleted && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: '#5b5bd6' }}
        >
          <Check size={10} color="white" strokeWidth={3} />
        </div>
      )}

      {/* Icon container */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: isCompleted ? 'rgba(91,91,214,0.10)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <Icon
          size={18}
          color={isCompleted ? '#5b5bd6' : '#94a3b8'}
          strokeWidth={2}
        />
      </div>

      {/* Name */}
      <p
        className="text-sm font-medium leading-tight"
        style={{ color: isCompleted ? '#1e293b' : '#94a3b8' }}
      >
        {habit.name}
      </p>

      {/* Streak */}
      <p className="text-xs mt-1" style={{ color: isCompleted ? '#818cf8' : '#cbd5e1' }}>
        {streak > 0 ? `🔥 ${streak}d streak` : 'Start today'}
      </p>

      {/* Loading shimmer */}
      {loading && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.6)' }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(91,91,214,0.3)', borderTopColor: '#5b5bd6' }}
          />
        </div>
      )}
    </button>
  )
}
