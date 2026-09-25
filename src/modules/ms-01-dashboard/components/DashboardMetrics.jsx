import { useState, useEffect } from 'react'

const METRICS = [
  {
    key: 'bienes',
    title: 'Bienes Patrimoniales',
    ms: 'MS-04',
    color: '#6366f1',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
  },
  {
    key: 'movimientos',
    title: 'Movimientos',
    ms: 'MS-05',
    color: '#0ea5e9',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  {
    key: 'inventarios',
    title: 'Inventarios',
    ms: 'MS-06',
    color: '#10b981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: 'mantenimientos',
    title: 'Mantenimientos',
    ms: 'MS-07',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
]

function Counter({ value }) {
  const n = parseInt(String(value).replace(/\D/g, '')) || 0
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (n === 0) { setDisplay(0); return }
    const duration = 800
    const steps = 30
    const increment = n / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= n) {
        setDisplay(n)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [n])

  return <span>{typeof value === 'string' ? value.replace(/\d+/g, String(display)) : display}</span>
}

export default function DashboardMetrics({ summary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {METRICS.map((m, i) => {
        const data = summary?.[m.key]
        return (
          <div
            key={m.key}
            className={`group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up delay-${i + 1}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 bg-[var(--dot)]" style={{ '--dot': m.color }} />
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${m.bg} ${m.text}`}>
                {m.ms}
              </span>
              <div className={`p-2 rounded-lg ${m.bg} ${m.text} transition-transform group-hover:scale-110 duration-300`}>
                {m.icon}
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500">{m.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">
              {data ? <Counter value={data.value ?? '-'} /> : '-'}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">{data?.caption || 'Cargando...'}</span>
              {data?.trend && (
                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${
                  data.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    {data.trend === 'up'
                      ? <polyline points="18 15 12 9 6 15" />
                      : <polyline points="6 9 12 15 18 9" />
                    }
                  </svg>
                  {data.trendLabel}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
