import React from 'react'

function Card({ title, value, caption, color, svg }){
  return (
    <div className="dashboard-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div>
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{caption}</div>
      </div>
      <div className="icon-wrapper">{svg}</div>
    </div>
  )
}

export default function DashboardWidgets(){
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card title="Bienes Activos" value="314" caption="Centros educativos" color="#34d399" svg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12h6l3-8 3 16 3-6h6" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
      <Card title="Bienes en Baja" value="173" caption="Centros educativos" color="#ef4444" svg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 7h18M6 11h12M9 15h6" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
      <Card title="Bienes en Mantenimiento" value="65" caption="Centros educativos" color="#f59e0b" svg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v6M12 22v-6M4.2 6.2l4.2 4.2M19.8 17.8l-4.2-4.2" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
      <Card title="Bienes en Movimientos" value="1" caption="Centros educativos" color="#0ea5e9" svg={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
    </div>
  )
}
