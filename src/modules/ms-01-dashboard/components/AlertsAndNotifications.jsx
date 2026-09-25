const alerts = [
  { id: 1, tag: 'Mantenimiento', color: 'amber', title: 'Laptop HP-05 requiere revisión técnica', time: 'Hace 10 min', icon: 'tool' },
  { id: 2, tag: 'Sistema', color: 'indigo', title: 'Nuevo parche de seguridad aplicado en MS-02', time: 'Hace 1 hora', icon: 'shield' },
  { id: 3, tag: 'Baja', color: 'rose', title: 'Resolución de baja R-004 aprobada por gerencia', time: 'Ayer', icon: 'trash' },
  { id: 4, tag: 'Inventario', color: 'emerald', title: 'Toma de inventario físico Q3 programada', time: 'Hace 2 días', icon: 'clipboard' },
]

const ICONS = {
  tool: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  shield: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  clipboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
}

const COLOR_MAP = {
  amber: { dot: 'bg-amber-500', ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  indigo: { dot: 'bg-indigo-500', ring: 'ring-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  rose: { dot: 'bg-rose-500', ring: 'ring-rose-200', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  emerald: { dot: 'bg-emerald-500', ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
}

export default function AlertsAndNotifications() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Alertas Recientes
        </h3>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Ver todas</button>
      </div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
          <div className="space-y-5">
            {alerts.map((alert) => {
              const c = COLOR_MAP[alert.color] || COLOR_MAP.indigo
              return (
                <div key={alert.id} className="relative flex gap-4">
                  <div className={`relative z-10 w-6 h-6 rounded-full ${c.bg} flex items-center justify-center text-slate-500 ring-4 ring-white ${c.ring}`}>
                    {ICONS[alert.icon] || ICONS.tool}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 leading-snug">{alert.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
                        {alert.tag}
                      </span>
                      <span className="text-[10px] text-slate-400">{alert.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
