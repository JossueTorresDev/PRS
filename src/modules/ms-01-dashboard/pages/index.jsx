import { useState, useEffect, useMemo } from 'react'
import DashboardMetrics from '../components/DashboardMetrics'
import LastMovements from '../components/LastMovements'
import AlertsAndNotifications from '../components/AlertsAndNotifications'
import SystemOverview from '../components/SystemOverview'
import dashboardService from '../services/dashboardService'
import { useAuth } from '../../ms-02-authentication/hooks/useAuth'
import '../components/dashboard.css'

const FALLBACK = {
  bienes: { value: 3412, caption: 'Total activos registrados', trend: 'up', trendLabel: '12 nuevos' },
  movimientos: { value: 28, caption: 'Asignaciones este mes', trend: 'up', trendLabel: '5% más' },
  inventarios: { value: 2, caption: 'Procesos anuales activos' },
  mantenimientos: { value: 15, caption: 'Equipos en taller', trend: 'down', trendLabel: '-3 tks' },
}

function SkeletonCard() {
  return (
    <div className="bg-white/80 rounded-xl p-5 border border-slate-100 animate-pulse">
      <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
      <div className="h-7 w-16 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-32 bg-slate-200 rounded" />
    </div>
  )
}

export default function DashboardModule() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 18) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await dashboardService.getSummary()
        if (mounted) setSummary(data)
      } catch {
        if (mounted) setSummary(FALLBACK)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const today = useMemo(() => {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  }, [])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">{greeting}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {user?.nombre || 'Usuario'}
              </h1>
              <p className="text-slate-400 text-sm mt-1 capitalize">{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl border border-white/20 backdrop-blur-sm transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar
              </button>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Reporte Global
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <DashboardMetrics summary={summary} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LastMovements />
          </div>
          <div className="lg:col-span-1">
            <AlertsAndNotifications />
          </div>
        </div>

        <SystemOverview />
      </div>
    </div>
  )
}
