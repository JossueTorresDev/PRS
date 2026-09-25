const STATUS_STYLES = {
  Completado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
  'En Proceso': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
}

const movements = [
  { id: 'M-1024', tag: 'Asignación', asset: 'Laptop Lenovo ThinkPad', user: 'Juan Pérez', status: 'Completado', date: 'Hoy, 09:30 AM' },
  { id: 'M-1025', tag: 'Devolución', asset: 'Monitor Dell 24"', user: 'María Gómez', status: 'Pendiente', date: 'Hoy, 10:15 AM' },
  { id: 'M-1026', tag: 'Traslado', asset: 'Impresora Epson L3150', user: 'Soporte TI', status: 'En Proceso', date: 'Ayer, 04:20 PM' },
  { id: 'M-1027', tag: 'Asignación', asset: 'Silla Ergonómica', user: 'Carlos Ruiz', status: 'Completado', date: 'Ayer, 11:00 AM' },
  { id: 'M-1028', tag: 'Baja', asset: 'Escritorio Metálico', user: 'Admin', status: 'Cancelado', date: 'Hace 2 días' },
]

export default function LastMovements() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-800">Últimos Movimientos</h3>
          <p className="text-xs text-slate-500 mt-0.5">Historial de transferencias recientes</p>
        </div>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
          Ver todos
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Movimiento</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Activo</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Responsable</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movements.map((mov, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      mov.tag === 'Asignación' ? 'bg-indigo-50 text-indigo-600' :
                      mov.tag === 'Devolución' ? 'bg-emerald-50 text-emerald-600' :
                      mov.tag === 'Traslado' ? 'bg-sky-50 text-sky-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {mov.tag}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{mov.id}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-slate-700">{mov.asset}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-slate-600">{mov.user}</span>
                  <span className="block text-[10px] text-slate-400">{mov.date}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    STATUS_STYLES[mov.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      mov.status === 'Completado' ? 'bg-emerald-500' :
                      mov.status === 'Pendiente' ? 'bg-amber-500' :
                      mov.status === 'En Proceso' ? 'bg-indigo-500' : 'bg-rose-500'
                    }`} />
                    {mov.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
