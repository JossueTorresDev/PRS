import React, { useEffect, useMemo } from 'react';
import useReports from '../hooks/useReports';
import { ReportSummary } from '../components/ReportSummary';
import { AssetsList } from '../components/AssetsList';
import { MovementsSummary } from '../components/MovementsSummary';
import { InventorySummary } from '../components/InventorySummary';
import { MaintenanceSummary } from '../components/MaintenanceSummary';
import { ExportButtons } from '../components/ExportButtons';

/**
 * Página principal del módulo de Reportes - Diseño Premium Alto Contraste
 */
export default function ReportesModule() {
  const {
    loading, error, clearError,
    assets, movements, inventories, maintenances,
    categories, locations, stats,
    loadAll,
    exportAssetsCSV, exportMovementsCSV,
  } = useReports();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const categoryChart = useMemo(() => {
    const entries = Object.entries(stats.assetsByCategory || {}).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 8);
  }, [stats.assetsByCategory]);

  const locationChart = useMemo(() => {
    const entries = Object.entries(stats.assetsByLocation || {}).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 6);
  }, [stats.assetsByLocation]);

  return (
    <div className="min-h-screen bg-[#F1F5F9]"> {/* Fondo más oscuro para contraste */}
      {/* Top Banner / Header Area */}
      <div className="bg-slate-900 border-b border-white/10 px-8 py-10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent blur-3xl" />

        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <h1 className="text-4xl font-black text-white tracking-tighter">
                Inteligencia Patrimonial
              </h1>
            </div>
            <p className="text-slate-400 text-[15px] font-semibold ml-[1.5rem] tracking-tight">
              Monitorización analítica avanzada y consolidación de activos municipales.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadAll}
              disabled={loading}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[13px] font-black hover:bg-slate-100 transition-all shadow-2xl active:scale-95 disabled:opacity-50 tracking-[0.1em]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ANALIZANDO...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                  SINCRONIZAR DASHBOARD
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-12 space-y-12">
        {/* Error Alert */}
        {error && (
          <div className="bg-white border-l-8 border-rose-500 rounded-2xl shadow-lg p-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div className="space-y-1">
                <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest">Alerta de sincronización</p>
                <p className="text-slate-800 font-bold tracking-tight">{error}</p>
              </div>
            </div>
            <button onClick={clearError} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        )}

        {/* 1. KPIs Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-indigo-500 pl-4">Metricas de Gestión</span>
          </div>
          <ReportSummary stats={stats} loading={loading} />
        </section>

        {/* 2. Primary Analytics */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {/* Chart 1: Categories */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Inventario por Categoría</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Status Actual</p>
              </div>
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              </div>
            </div>

            {!categoryChart.length ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-16 text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cargando analitica...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {categoryChart.map(([cat, count]) => {
                  const max = Math.max(...categoryChart.map(e => e[1]));
                  const pct = (count / max) * 100;
                  return (
                    <div key={cat} className="group/item">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-black text-slate-600 group-hover/item:text-indigo-600 transition-colors uppercase tracking-tight truncate max-w-[80%]">{cat}</span>
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-black text-slate-900">{count}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart 2: Locations */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-[4rem] group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Presencia Territorial</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Ubicaciones Fisicas</p>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
            </div>

            {!locationChart.length ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-16 text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Localizando activos...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {locationChart.map(([loc, count]) => {
                  const max = Math.max(...locationChart.map(e => e[1]));
                  const pct = (count / max) * 100;
                  return (
                    <div key={loc} className="group/item">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-black text-slate-600 group-hover/item:text-emerald-600 transition-colors uppercase tracking-tight truncate max-w-[80%]">{loc}</span>
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-black text-slate-900">{count}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-in-out shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 3. Operational Summary Triple Panel */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-slate-800 pl-4">Actividad Operativa</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <MovementsSummary movements={movements} loading={loading} />
            <InventorySummary inventories={inventories} loading={loading} />
            <MaintenanceSummary maintenances={maintenances} loading={loading} />
          </div>
        </section>

        {/* 4. Deep Analysis & Export Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
            <ExportButtons
              onExportAssets={exportAssetsCSV}
              onExportMovements={exportMovementsCSV}
              loading={loading}
              hasData={assets.length > 0}
              stats={stats}
            />
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden h-full">
              <div className="p-10 border-b border-slate-50">
                <div className="flex items-center gap-5 text-indigo-600 mb-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Auditoría Detallada</h3>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                  Listado maestro de bienes patrimoniales para supervisión técnica y administrativa.
                  Filtre por estado operativo para agilizar procesos de baja o mantenimiento.
                </p>
              </div>
              <div className="p-2">
                <AssetsList
                  assets={assets}
                  loading={loading}
                  categories={categories}
                  locations={locations}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
