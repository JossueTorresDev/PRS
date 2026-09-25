import React from 'react';

/**
 * Resumen de movimientos recientes
 */
export function MovementsSummary({ movements, loading }) {
    const recent = (movements || []).slice(0, 4);

    const statusMap = {
        'COMPLETED': { label: 'Completado', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'COMPLETADO': { label: 'Completado', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        'PENDING': { label: 'Pendiente', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'PENDIENTE': { label: 'Pendiente', class: 'bg-amber-50 text-amber-600 border-amber-100' },
        'PENDING_APPROVAL': { label: 'Por Aprobar', class: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        'IN_PROCESS': { label: 'En Proceso', class: 'bg-blue-50 text-blue-600 border-blue-100' },
        'REJECTED': { label: 'Rechazado', class: 'bg-rose-50 text-rose-600 border-rose-100' },
    };

    const typeLabel = (t) => {
        const map = {
            'TRANSFER': 'Transferencia',
            'LOAN': 'Préstamo',
            'RETURN': 'Devolución',
            'ASSIGNMENT': 'Asignación',
            'REASSIGNMENT': 'Reasignación',
        };
        return map[(t || '').toUpperCase()] || t || '-';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" /><path d="m18 2 4 4-4 4" /><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" /><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" /><path d="m18 14 4 4-4 4" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 tracking-tight">Movimientos Recientes</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{movements.length} total</span>
            </div>

            <div className="flex-1 divide-y divide-gray-50">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-50 rounded w-1/2" />
                        </div>
                    ))
                ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" /></svg>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Sin movimientos registrados</p>
                    </div>
                ) : (
                    recent.map((mov, idx) => {
                        const status = statusMap[(mov.status || '').toUpperCase()] || { label: mov.status, class: 'bg-gray-50 text-gray-500 border-gray-100' };
                        return (
                            <div key={mov.id || idx} className="px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-default">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-gray-800 tracking-tight">
                                        {typeLabel(mov.movementType || mov.type)}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.class}`}>
                                        {(status?.label || '').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500 line-clamp-1 flex-1 pr-4">
                                        {mov.observations || mov.reason || 'Sin observaciones'}
                                    </p>
                                    {mov.createdAt && (
                                        <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                            {new Date(mov.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {recent.length > 0 && (
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                    <button className="w-full py-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all uppercase tracking-widest">
                        Ver todo el historial
                    </button>
                </div>
            )}
        </div>
    );
}
