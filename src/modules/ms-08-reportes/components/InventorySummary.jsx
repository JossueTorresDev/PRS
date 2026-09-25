import React from 'react';

/**
 * Resumen de inventarios
 */
export function InventorySummary({ inventories, loading }) {
    const statusMap = {
        'COMPLETED': { label: 'Completado', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'CLOSED': { label: 'Cerrado', class: 'bg-gray-50 text-gray-600 border-gray-100' },
        'IN_PROGRESS': { label: 'En Progreso', class: 'bg-blue-50 text-blue-600 border-blue-100' },
        'STARTED': { label: 'Iniciado', class: 'bg-blue-50 text-blue-600 border-blue-100' },
        'PENDING': { label: 'Pendiente', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'CREATED': { label: 'Creado', class: 'bg-amber-50 text-amber-600 border-amber-100' },
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14h.01" /><path d="M15 14h.01" /><path d="M9 18h.01" /><path d="M15 18h.01" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-tight">Inventarios Físicos</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inventories.length} total</span>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-1/2" />
                        </div>
                    ))
                ) : inventories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Sin procesos activos</p>
                    </div>
                ) : (
                    inventories.slice(0, 4).map((inv, idx) => {
                        const status = statusMap[(inv.status || '').toUpperCase()] || { label: inv.status, class: 'bg-gray-50 text-gray-500 border-gray-100' };
                        return (
                            <div key={inv.id || idx} className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-default">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-gray-800 tracking-tight truncate pr-4">
                                        {inv.name || inv.title || `Inventario #${idx + 1}`}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.class} whitespace-nowrap`}>
                                        {(status?.label || '').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    <span className="text-[10px] font-medium text-gray-400">
                                        {new Date(inv.startDate || inv.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {inventories.length > 0 && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                    <button className="w-full py-2 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all uppercase tracking-widest">
                        Ver planificación anual
                    </button>
                </div>
            )}
        </div>
    );
}
