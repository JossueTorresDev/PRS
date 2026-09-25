import React, { useState } from 'react';
import { generateConsolidatedPdf } from '../services/reportsPdfService';

/**
 * Botones de exportación de datos - Diseño Refinado con Reporte Gerencial
 */
export function ExportButtons({ onExportAssets, onExportMovements, loading, hasData, stats }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type, fn) => {
    setExporting(type);
    try {
      if (type === 'general-pdf') {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const municipalityName = user.municipalityName || 'MUNICIPALIDAD DISTRITAL';
        await generateConsolidatedPdf(stats, municipalityName);
      } else {
        await fn();
      }
    } catch (err) {
      console.error('Error exportando:', err);
    }
    setTimeout(() => setExporting(null), 500);
  };

  const buttons = [
    {
      key: 'general-pdf',
      label: 'Reporte Gerencial (PDF)',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
      ),
      color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
      onClick: () => handleExport('general-pdf'),
      fullWidth: true,
    },
    {
      key: 'assets-csv',
      label: 'Inventario (CSV)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      ),
      color: 'bg-slate-700 hover:bg-slate-800 shadow-slate-100',
      onClick: () => handleExport('assets-csv', onExportAssets),
    },
    {
      key: 'movements-csv',
      label: 'Movimientos (CSV)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      ),
      color: 'bg-slate-700 hover:bg-slate-800 shadow-slate-100',
      onClick: () => handleExport('movements-csv', onExportMovements),
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Exportación Analítica</h3>
        </div>
        <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-8">
          Genere archivos consolidados para auditorías externas o revisiones gerenciales inmediatas.
        </p>
      </div>

      {!hasData ? (
        <div className="bg-slate-50 rounded-2xl py-8 text-center border-2 border-dashed border-slate-200">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">Sincronización de datos necesaria para exportar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buttons.map((btn) => (
            <button
              key={btn.key}
              onClick={btn.onClick}
              disabled={loading || exporting === btn.key}
              className={`${btn.color} text-white ${btn.fullWidth ? 'w-full py-4' : 'w-full py-3'} rounded-2xl text-[11px] font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg hover:-translate-y-1 active:translate-y-0 tracking-widest`}
            >
              <span className={exporting === btn.key ? 'animate-spin' : ''}>
                {btn.icon}
              </span>
              {exporting === btn.key ? 'PROCESANDO...' : btn.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
