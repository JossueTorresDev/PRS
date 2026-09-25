import React from 'react';

/**
 * Iconos SVG para ReportSummary
 */
const Icons = {
  Package: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  Check: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  ),
  Refresh: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
  ),
  XCircle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
  ),
  Shuffle: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" /><path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" /><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" /></svg>
  ),
  Wrench: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
  )
};

/**
 * Tarjetas de estadísticas - Versión con mayor Contraste
 */
export function ReportSummary({ stats, loading }) {
  const cards = [
    {
      label: 'Total Bienes',
      value: stats.totalAssets,
      icon: Icons.Package,
      accentColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      shadowColor: 'rgba(59, 130, 246, 0.2)',
    },
    {
      label: 'Disponibles',
      value: stats.assetsDisponible,
      icon: Icons.Check,
      accentColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      shadowColor: 'rgba(16, 185, 129, 0.2)',
    },
    {
      label: 'En Uso',
      value: stats.assetsEnUso,
      icon: Icons.Refresh,
      accentColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
      shadowColor: 'rgba(249, 115, 22, 0.2)',
    },
    {
      label: 'Dados de Baja',
      value: stats.assetsBaja,
      icon: Icons.XCircle,
      accentColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      shadowColor: 'rgba(244, 63, 94, 0.2)',
    },
    {
      label: 'Movimientos',
      value: stats.totalMovements,
      icon: Icons.Shuffle,
      accentColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      shadowColor: 'rgba(99, 102, 241, 0.2)',
      sub: `${stats.movementsPending} pendientes`,
    },
    {
      label: 'Mantenimientos',
      value: stats.totalMaintenances,
      icon: Icons.Wrench,
      accentColor: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-100',
      shadowColor: 'rgba(139, 92, 246, 0.2)',
      sub: `${stats.maintenancesPending} pendientes`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative group ${card.bgColor} rounded-3xl p-6 border ${card.borderColor} transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl`}
          style={{
            boxShadow: `0 20px 40px -12px ${card.shadowColor}`,
          }}
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-all duration-300 ${card.accentColor}`}>
              <card.icon />
            </div>
            {loading && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-black text-slate-500/80 uppercase tracking-[0.15em]">
              {card.label}
            </p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              {loading ? (
                <div className="h-9 w-16 bg-white/50 rounded-xl animate-pulse" />
              ) : (
                card.value
              )}
            </h3>
            {card.sub && (
              <div className="mt-2">
                <span className="text-[10px] font-bold text-slate-500 bg-white/60 px-2.5 py-1 rounded-lg border border-white/40">
                  {card.sub.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Accent decoration */}
          <div className={`absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all`} />
        </div>
      ))}
    </div>
  );
}
