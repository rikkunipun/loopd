// Reusable question row — used for both daily questions and journal prompts.
// options: Array<{ label: string, val: number | string }>
// value: current saved value (null/undefined = no answer yet)

export default function QuestionCard({ question, options, value, onSelect }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2 leading-snug">
        {question}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ label, val }) => {
          const selected = value !== null && value !== undefined && value === val
          return (
            <button
              key={String(val)}
              onClick={() => onSelect(val)}
              className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 select-none"
              style={{
                background: selected ? '#5b5bd6' : 'rgba(255,255,255,0.75)',
                color: selected ? '#fff' : '#475569',
                border: selected
                  ? '1px solid transparent'
                  : '1px solid rgba(0,0,0,0.07)',
                boxShadow: selected ? '0 2px 8px rgba(91,91,214,0.25)' : 'none',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
