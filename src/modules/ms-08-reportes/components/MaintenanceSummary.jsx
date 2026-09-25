import React from 'react';

/**
 * Resumen de mantenimientos
 */
export function MaintenanceSummary({ maintenances, loading }) {
    const statusMap = {
        'COMPLETED': { label: 'Completado', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'CONFIRMED': { label: 'Confirmado', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'IN_PROGRESS': { label: 'En Curso', class: 'bg-blue-50 text-blue-600 border-blue-100' },
        'SCHEDULED': { label: 'Programado', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'PENDING': { label: 'Pendiente', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'CANCELLED': { label: 'Cancelado', class: 'bg-rose-50 text-rose-600 border-rose-100' },
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 rounded-lg text-violet-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-tight">Mantenimientos</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{maintenances.length} total</span>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-1/2" />
                        </div>
                    ))
                ) : maintenances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Sin tareas programadas</p>
                    </div>
                ) : (
                    maintenances.slice(0, 4).map((m, idx) => {
                        const status = statusMap[(m.status || '').toUpperCase()] || { label: m.status, class: 'bg-gray-50 text-gray-500 border-gray-100' };
                        return (
                            <div key={m.id || idx} className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-default">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-gray-800 tracking-tight truncate pr-4">
                                        {m.description || m.maintenanceType || `Mantenimiento #${idx + 1}`}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.class} whitespace-nowrap`}>
                                        {(status?.label || '').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                                    <span>Bien ID: {m.assetId?.substring(0, 8) || '-'}</span>
                                    <span className="text-gray-200">|</span>
                                    <span>{new Date(m.scheduledDate || m.createdAt).toLocaleDateString('es-PE')}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {maintenances.length > 0 && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                    <button className="w-full py-2 text-[11px] font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all uppercase tracking-widest">
                        Gestionar preventivos
                    </button>
                </div>
            )}
        </div>
    );
}
