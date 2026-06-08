const MOODS = [
  { emoji: '😔', value: 1 },
  { emoji: '😐', value: 2 },
  { emoji: '🙂', value: 3 },
  { emoji: '😄', value: 4 },
  { emoji: '🔥', value: 5 },
]

const TIME_SLOTS = [
  { label: 'Afternoon', field: 'mood_afternoon' },
  { label: 'Evening',   field: 'mood_evening'   },
  { label: 'Night',     field: 'mood_night'     },
]

export default function MoodPicker({ todayLog, onSave }) {
  return (
    <section className="mt-7">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Mood
      </h2>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 2px 12px rgba(91,91,214,0.06)',
        }}
      >
        {TIME_SLOTS.map(({ label, field }, i) => {
          const selected = todayLog?.[field]
          return (
            <div
              key={field}
              className="flex items-center px-4 py-3"
              style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}
            >
              {/* Time label */}
              <span className="text-sm font-medium text-slate-400 w-24 flex-shrink-0">
                {label}
              </span>

              {/* Emoji buttons */}
              <div className="flex items-center gap-1 ml-auto">
                {MOODS.map(({ emoji, value }) => {
                  const isSelected = selected === value
                  return (
                    <button
                      key={value}
                      onClick={() => onSave(field, value)}
                      className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-150 active:scale-90 select-none"
                      style={{
                        fontSize: '22px',
                        opacity: isSelected ? 1 : (selected ? 0.3 : 0.55),
                        background: isSelected ? 'rgba(91,91,214,0.12)' : 'transparent',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      }}
                      aria-label={`${label} mood ${value}`}
                    >
                      {emoji}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
