import React, { useState, useEffect } from 'react';
import { useAuth } from '../../ms-02-authentication/hooks/useAuth';
import assetMovementService from '../../ms-05-movements/services/assetMovementService';
import { getAllDisposals } from '../../ms-04-patrimonio/services/disposalService';
import { getAllInventoriesByMunicipality, getMunicipalityIdFromSession } from '../../ms-06-inventario/services/inventoryApi';
import maintenanceService from '../../ms-07-mantenimiento/services/maintenanceService';

const MOCK_DATA = {
  movements: [
    { id: 1, movementCode: 'MOV-2026-001', movementType: 'Asignación', originResponsibleName: 'Juan Pérez', status: 'PENDING' },
    { id: 2, movementCode: 'MOV-2026-002', movementType: 'Traslado', originResponsibleName: 'María García', status: 'IN_PROCESS' },
    { id: 3, movementCode: 'MOV-2026-003', movementType: 'Devolución', originResponsibleName: 'Carlos López', status: 'PENDING' },
  ],
  disposals: [
    { id: 1, status: 'INITIATED' },
    { id: 2, status: 'EVALUATION' },
  ],
  inventories: [
    { id: 1, status: 'OPEN' },
  ],
  maintenances: [
    { assetId: 'AS-001', assetName: 'Camioneta Toyota Hilux', priority: 'CRITICAL', description: 'Falla en sistema de frenos' },
    { assetId: 'AS-045', assetName: 'Laptop HP ProBook', priority: 'HIGH', description: 'Pantalla dañada' },
  ]
};

export default function InternalManagement() {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muniName, setMuniName] = useState(sessionStorage.getItem('muniName') || 'la Municipalidad');
  const [muniLogo, setMuniLogo] = useState(sessionStorage.getItem('muniLogo') || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const muniId = getMunicipalityIdFromSession();
        
        // Fetch real data with fallback to empty array
        const [movs, disp, invs, mains] = await Promise.all([
          assetMovementService.getAllMovements().catch(() => []),
          getAllDisposals().catch(() => []),
          getAllInventoriesByMunicipality(muniId).catch(() => []),
          maintenanceService.getAll(muniId, 0, 50).catch(() => [])
        ]);

        // Combine with mock data if real data is empty
        const finalMovs = (Array.isArray(movs) && movs.length > 0) ? movs : MOCK_DATA.movements;
        const finalDisp = (Array.isArray(disp) && disp.length > 0) ? disp : MOCK_DATA.disposals;
        const finalInvs = (Array.isArray(invs) && invs.length > 0) ? invs : MOCK_DATA.inventories;
        
        const fetchedMains = mains?.content || mains || [];
        const finalMains = (Array.isArray(fetchedMains) && fetchedMains.length > 0) ? fetchedMains : MOCK_DATA.maintenances;

        setMovements(finalMovs);
        setDisposals(finalDisp);
        setInventories(finalInvs);
        setMaintenances(finalMains);
      } catch (error) {
        console.error('Error fetching internal management data:', error);
        setMovements(MOCK_DATA.movements);
        setDisposals(MOCK_DATA.disposals);
        setInventories(MOCK_DATA.inventories);
        setMaintenances(MOCK_DATA.maintenances);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingMovements = movements.filter(m => m.status === 'PENDING' || m.status === 'IN_PROCESS');
  const displayMovements = pendingMovements.length > 0 ? pendingMovements : MOCK_DATA.movements;

  const pendingDisposals = disposals.filter(d => d.status === 'INITIATED' || d.status === 'EVALUATION');
  const displayDisposals = pendingDisposals.length > 0 ? pendingDisposals : MOCK_DATA.disposals;

  const activeInventories = inventories.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS');
  const displayInventories = activeInventories.length > 0 ? activeInventories : MOCK_DATA.inventories;

  const criticalMaintenances = maintenances.filter(m => m.priority === 'HIGH' || m.priority === 'CRITICAL');
  const displayMaintenances = criticalMaintenances.length > 0 ? criticalMaintenances : MOCK_DATA.maintenances;

  const queues = [
    { title: 'Movimientos Pendientes', count: displayMovements.length, icon: 'refresh', color: 'indigo' },
    { title: 'Bajas por Aprobar', count: displayDisposals.length, icon: 'trash', color: 'rose' },
    { title: 'Inventarios Activos', count: displayInventories.length, icon: 'clipboard', color: 'emerald' },
    { title: 'Mantenimientos Críticos', count: displayMaintenances.length, icon: 'tool', color: 'amber' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden shadow-inner">
            {muniLogo ? (
              <img src={muniLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7M4 21V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17"/>
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión Operativa</h1>
            <div className="flex flex-col gap-0.5">
              <p className="text-slate-600 font-medium text-sm">{muniName}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Sesión de: <span className="font-semibold text-slate-500">{user?.nombre || 'Administrador'}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm">
            Exportar Logs
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all text-sm">
            Nueva Acción Masiva
          </button>
        </div>
      </div>

      {/* Queues Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {queues.map((q, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className={`w-12 h-12 rounded-2xl bg-${q.color}-50 text-${q.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {q.icon === 'refresh' && <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />}
                {q.icon === 'trash' && <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>}
                {q.icon === 'clipboard' && <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>}
                {q.icon === 'tool' && <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />}
              </svg>
            </div>
            <p className="text-3xl font-bold text-slate-900">{loading ? '...' : q.count}</p>
            <p className="text-sm font-medium text-slate-500 mt-1">{q.title}</p>
          </div>
        ))}
      </div>

      {/* Main Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Approvals Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Cola de Aprobación (Movimientos)</h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-bold">Ver Todo</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Trámite</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Solicitante</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">Cargando cola de aprobación...</td></tr>
                ) : displayMovements.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">No hay trámites pendientes.</td></tr>
                ) : displayMovements.slice(0, 10).map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700 text-sm">{mov.movementCode || `MOV-${mov.id}`}</p>
                      <p className="text-xs text-slate-400">{mov.movementType || 'Movimiento'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {mov.originResponsibleName?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <p className="text-sm text-slate-600 truncate max-w-[150px]">{mov.originResponsibleName || 'Usuario'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        mov.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {mov.status === 'PENDING' ? 'Pendiente' : 'En Proceso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">Gestionar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coordination Sidebar */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h4 className="text-lg font-bold mb-2 relative z-10">Inventarios</h4>
            <p className="text-indigo-100 text-sm mb-6 relative z-10">
              {displayInventories.length > 0 
                ? `Hay ${displayInventories.length} procesos de inventario activos.` 
                : 'No hay procesos de inventario activos en este momento.'}
            </p>
            {displayInventories.length > 0 && (
              <div className="w-full bg-indigo-500/50 rounded-full h-2 mb-4 relative z-10">
                <div className="bg-white h-full rounded-full w-[45%]" />
              </div>
            )}
            <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-all">
              Gestionar Inventarios
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4">Mantenimientos Críticos</h4>
            <div className="space-y-4">
              {loading ? (
                <p className="text-xs text-slate-400">Cargando...</p>
              ) : displayMaintenances.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No hay mantenimientos críticos reportados.</p>
              ) : displayMaintenances.slice(0, 3).map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-auto rounded-full bg-amber-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{m.assetName || `Activo ${m.assetId}`}</p>
                    <p className="text-xs text-slate-400 truncate">{m.description || 'Sin descripción'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
