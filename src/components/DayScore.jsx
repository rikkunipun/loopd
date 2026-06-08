const CONFIG = {
  win: {
    label: 'Win',
    emoji: '🏆',
    bg: 'rgba(34,197,94,0.09)',
    border: 'rgba(34,197,94,0.22)',
    color: '#16a34a',
    sub: 'Excellent day. Keep this going.',
  },
  partial: {
    label: 'Partial',
    emoji: '⚡',
    bg: 'rgba(245,158,11,0.09)',
    border: 'rgba(245,158,11,0.25)',
    color: '#d97706',
    sub: 'Good progress. Push for the full win.',
  },
  loss: {
    label: 'Off day',
    emoji: '🌱',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.18)',
    color: '#dc2626',
    sub: "Every streak starts with one. Go again.",
  },
}

export default function DayScore({ score, completed, total }) {
  const cfg = CONFIG[score] || CONFIG.loss

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center justify-between"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{cfg.emoji}</span>
          <span className="text-sm font-semibold" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-tight">{cfg.sub}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold leading-none" style={{ color: cfg.color }}>
          {completed}
          <span className="text-base font-medium text-slate-400">/{total}</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">habits done</p>
      </div>
    </div>
  )
}
