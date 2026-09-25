import React, { useState, useEffect } from 'react';
import { useAuth } from '../../ms-02-authentication/hooks/useAuth';
import DashboardMetrics from '../components/DashboardMetrics';
import LastMovements from '../components/LastMovements';
import AlertsAndNotifications from '../components/AlertsAndNotifications';
import dashboardService from '../services/dashboardService';

const FALLBACK = {
  bienes: { value: 1240, caption: 'Bienes a mi cargo', trend: 'up', trendLabel: '3 nuevos' },
  movimientos: { value: 5, caption: 'Pendientes de firma', trend: 'down', trendLabel: '-2' },
  inventarios: { value: 1, caption: 'Proceso en curso' },
  mantenimientos: { value: 2, caption: 'En revisión técnica' },
};

export default function MunicipalDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardService.getSummary();
        setSummary(data);
      } catch {
        setSummary(FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">¡Hola, {user?.nombre?.split(' ')[0] || 'Usuario'}!</h1>
          <p className="text-indigo-100 mt-2 max-w-xl">
            Aquí tienes un resumen de tus activos y tareas pendientes para hoy. Mantén el control de tu patrimonio institucional de forma sencilla.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="px-5 py-2.5 bg-white text-indigo-600 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg">
              Solicitar Movimiento
            </button>
            <button className="px-5 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/50 text-white text-sm font-bold rounded-xl border border-white/20 backdrop-blur-sm transition-all">
              Ver mis Bienes
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <DashboardMetrics summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Tareas Prioritarias</h3>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase">3 Pendientes</span>
            </div>
            <div className="space-y-4">
              {[
                { task: 'Firmar Acta de Entrega M-1024', due: 'Hoy', type: 'Firma' },
                { task: 'Verificar estado de Laptop L-005', due: 'Mañana', type: 'Control' },
                { task: 'Actualizar ubicación de Monitor D-24', due: 'Viernes', type: 'Ubicación' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{item.task}</p>
                      <p className="text-xs text-slate-400">Vence: {item.due}</p>
                    </div>
                  </div>
                  <button className="text-indigo-600 font-bold text-sm">Completar</button>
                </div>
              ))}
            </div>
          </div>
          <LastMovements />
        </div>

        {/* Alerts Sidebar */}
        <div className="space-y-8">
          <AlertsAndNotifications />
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
             <h4 className="text-lg font-bold mb-4 relative z-10">Ayuda y Soporte</h4>
             <p className="text-slate-400 text-sm mb-6 relative z-10">¿Tienes dudas sobre cómo registrar un bien o solicitar un traslado?</p>
             <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-500/20">
               Ver Videotutoriales
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
