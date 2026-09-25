import React, { useState, useMemo } from 'react';

/**
 * Tabla de bienes patrimoniales con búsqueda y filtros - Diseño Premium
 */
export function AssetsList({ assets, loading, categories, locations }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = Array.isArray(assets) ? assets : [];
    if (!result.length) return [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        (a.description || a.assetName || a.name || '').toLowerCase().includes(q) ||
        (a.assetCode || a.code || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      result = result.filter(a => (a.categoryName || a.category || '') === filterCategory);
    }
    if (filterStatus) {
      result = result.filter(a => (a.status || '').toUpperCase() === filterStatus.toUpperCase());
    }
    return result;
  }, [assets, search, filterCategory, filterStatus]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(assets.map(a => a.categoryName || a.category).filter(Boolean));
    return [...cats].sort();
  }, [assets]);

  const uniqueStatuses = useMemo(() => {
    const sts = new Set(assets.map(a => a.status).filter(Boolean));
    return [...sts].sort();
  }, [assets]);

  const statusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const map = {
      'DISPONIBLE': { label: 'Disponible', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      'AVAILABLE': { label: 'Disponible', class: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      'EN_USO': { label: 'En Uso', class: 'bg-amber-50 text-amber-600 border-amber-100' },
      'IN_USE': { label: 'En Uso', class: 'bg-amber-50 text-amber-600 border-amber-100' },
      'BAJA': { label: 'Baja', class: 'bg-rose-50 text-rose-600 border-rose-100' },
      'DISPOSED': { label: 'Baja', class: 'bg-rose-50 text-rose-600 border-rose-100' },
      'MANTENIMIENTO': { label: 'Mantenimiento', class: 'bg-violet-50 text-violet-600 border-violet-100' },
      'MAINTENANCE': { label: 'Mantenimiento', class: 'bg-violet-50 text-violet-600 border-violet-100' },
    };
    const style = map[s] || { label: status, class: 'bg-gray-50 text-gray-500 border-gray-100' };
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${style.class}`}>
        {(style?.label || '').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filtros */}
      <div className="p-6 border-b border-gray-50 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por descripción, código de barras o ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
              className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none pr-8 cursor-pointer relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="">TODAS LAS CATEGORÍAS</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              className="px-4 py-2.5 bg-gray-50 border-none rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none pr-8 cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              <option value="">TODOS LOS ESTADOS</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="px-6 py-4 text-left">Código de Bien</th>
              <th className="px-6 py-4 text-left">Descripción del Activo</th>
              <th className="px-6 py-4 text-left">Categoría</th>
              <th className="px-6 py-4 text-left">Ubicación</th>
              <th className="px-6 py-4 text-left">Estado</th>
              <th className="px-6 py-4 text-right">Valor Inicial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <div className="h-4 bg-gray-50 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No se encontraron registros activos</p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((asset, idx) => (
                <tr key={asset.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded">
                      {asset.assetCode || asset.code || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[250px]">
                      <p className="text-sm font-bold text-gray-800 tracking-tight leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors">
                        {asset.description || asset.assetName || asset.name || '-'}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 truncate uppercase">ID: {asset.id?.substring(0, 10) || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-600 italic">
                      {asset.categoryName || asset.category || 'Sin Categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      <span className="text-xs font-medium text-gray-600">
                        {asset.locationName || asset.location || 'No Asignada'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{statusBadge(asset.status)}</td>
                  <td className="px-6 py-5 text-right font-mono whitespace-nowrap">
                    <span className="text-sm font-extrabold text-gray-800">
                      {asset.acquisitionValue || asset.purchasePrice
                        ? `S/ ${Number(asset.acquisitionValue || asset.purchasePrice).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-5 border-t border-gray-50 flex items-center justify-between bg-white">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            Hoja <span className="text-gray-800">{page + 1}</span> de <span className="text-gray-800">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-indigo-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-indigo-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
