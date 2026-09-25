const SERVICES = [
  {
    name: 'Auth & Usuarios',
    ms: 'MS-02',
    icon: 'users',
    color: 'indigo',
    stats: [
      { label: 'Usuarios Activos', value: '45' },
      { label: 'Nuevos (mes)', value: '+3', highlight: true },
    ],
    progress: 45,
    limit: 'Límite: 100',
    status: 'Operativo',
  },
  {
    name: 'Configuración',
    ms: 'MS-03',
    icon: 'settings',
    color: 'sky',
    stats: [
      { label: 'Catálogos SBN', value: 'Actualizado' },
      { label: 'Locales/Sedes', value: '12 Mapeados' },
    ],
    status: 'Operativo',
    sync: 'Hace 2h',
  },
  {
    name: 'Reportes',
    ms: 'MS-08',
    icon: 'file',
    color: 'emerald',
    stats: [
      { label: 'Generados Hoy', value: '14 PDF\'s' },
      { label: 'Pendientes', value: '3', highlight: true },
    ],
    status: 'Operativo',
    link: 'Ver Historial',
  },
]

const COLOR_CONFIG = {
  indigo: { dot: 'bg-indigo-500', ring: 'ring-indigo-100', icon: 'text-indigo-600', bg: 'bg-indigo-50', bar: 'bg-indigo-500' },
  sky: { dot: 'bg-sky-500', ring: 'ring-sky-100', icon: 'text-sky-600', bg: 'bg-sky-50', bar: 'bg-sky-500' },
  emerald: { dot: 'bg-emerald-500', ring: 'ring-emerald-100', icon: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
}

const ICONS = {
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
}

export default function SystemOverview() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-slate-50 to-white">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Estado del Sistema Global
        </h3>
        <span className="text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1.5 border border-emerald-200 w-fit">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Todos los servicios operativos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {SERVICES.map((svc) => {
          const c = COLOR_CONFIG[svc.color] || COLOR_CONFIG.indigo
          return (
            <div key={svc.ms} className="p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`p-1.5 rounded-lg ${c.bg} ${c.icon}`}>
                  {ICONS[svc.icon]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{svc.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{svc.ms}</p>
                </div>
                <div className="ml-auto">
                  <span className={`flex items-center gap-1 text-[10px] font-medium ${c.icon}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                    {svc.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {svc.stats.map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">{s.label}</span>
                    <span className={`font-semibold ${s.highlight ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>

              {svc.progress != null && (
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`${c.bar} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${svc.progress}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right mt-1">{svc.limit}</p>
                </div>
              )}

              {svc.sync && (
                <p className="text-[10px] text-slate-400 mt-3">Última sincronización: {svc.sync}</p>
              )}

              {svc.link && (
                <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-3">{svc.link}</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
