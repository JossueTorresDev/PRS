import { useEffect, useState } from "react";
import permissionService from "../../services/permissionService";
import PermissionDetailModal from "./PermissionDetailModal";

export default function PermissionsPage({ onBack }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => { loadPermissions(); }, []);

  const loadPermissions = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);
      const data = await permissionService.getAllPermissions();
      const normalizedData = Array.isArray(data) ? data.map(p => ({
        ...p,
        status: p.status === true || p.status === 1 || p.status === "ACTIVE" || p.status === "active" || p.isActive === true || p.active === true
      })) : [];
      setPermissions(normalizedData);
    } catch (err) {
      if (showSpinner) setError(`Error al cargar los permisos: ${err.message}`);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleViewDetail = (p) => { setSelectedPermission(p); setIsDetailModalOpen(true); };
  const closeDetailModal = () => { setIsDetailModalOpen(false); setSelectedPermission(null); };

  const filteredPermissions = permissions.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || [p.displayName, p.module, p.action, p.resource, p.description].some(f => f?.toLowerCase().includes(term));
    const matchModule = !filterModule || p.module === filterModule;
    const matchAction = !filterAction || p.action === filterAction;
    return matchSearch && matchModule && matchAction;
  });

  const uniqueModules = [...new Set(permissions.map(p => p.module))].filter(Boolean);
  const uniqueActions = [...new Set(permissions.map(p => p.action))].filter(Boolean);

  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterModule, filterAction]);

  const getActionBadge = (action) => {
    const badges = {
      read:   "bg-sky-100 text-sky-800",
      write:  "bg-emerald-100 text-emerald-800",
      delete: "bg-red-100 text-red-800",
      manage: "bg-violet-100 text-violet-800",
      "*":    "bg-amber-100 text-amber-800",
    };
    return badges[action] || "bg-gray-100 text-gray-800";
  };

  const getActionLabel = (action) => {
    const labels = { read: "Lectura", write: "Escritura", delete: "Eliminación", manage: "Gestión Total", "*": "Todos" };
    return labels[action] || action;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">

      {}
      <div className="bg-cyan-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Permisos</h1>
                <p className="text-cyan-100 text-sm font-medium">Administración de permisos del sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Volver
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {}
      {permissions.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex">
            <div className="bg-white border-l-4 border-l-cyan-500 rounded-2xl p-5 shadow-sm w-full max-w-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Permisos</p>
                  <p className="text-3xl font-bold text-slate-800">{permissions.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-cyan-50 text-cyan-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {}
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Buscar</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text" placeholder="Nombre, módulo, recurso..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Módulo</label>
            <div className="relative">
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm">
                <option value="">Todos</option>
                {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Acción</label>
            <div className="relative">
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm">
                <option value="">Todas</option>
                {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cyan-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Permiso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Módulo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Acción</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Recurso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPermissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron permisos</p>
                      <p className="text-slate-500">Intenta con otros filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPermissions.map((permission) => (
                  <tr
                    key={permission.id}
                    className={`group hover:bg-cyan-50/50 transition-all duration-200 border-l-4 ${permission.status === true ? "border-l-cyan-500 hover:border-l-cyan-600 bg-white" : "border-l-gray-300 bg-gray-50/50 opacity-60"}`}
                  >
                    {}
                    <td className="px-6 py-5">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{permission.displayName || permission.name || "Sin nombre"}</div>
                      </div>
                    </td>

                    {}
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-cyan-700">{permission.module}</span>
                    </td>

                    {}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadge(permission.action)}`}>
                        {getActionLabel(permission.action)}
                      </span>
                    </td>

                    {}
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-700">{permission.resource}</span>
                    </td>

                    {}
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-600 max-w-xs truncate">{permission.description || "—"}</p>
                    </td>

                    {}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleViewDetail(permission)} className="p-2.5 text-slate-600 hover:text-white hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-200 hover:border-slate-700 hover:shadow-md" title="Ver detalles">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {}
        {filteredPermissions.length > 0 && totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{startIndex + 1} - {Math.min(endIndex, filteredPermissions.length)}</span>
              <span>de</span>
              <span className="font-semibold text-slate-900">{filteredPermissions.length}</span>
              <span>registros</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="px-4 py-2 text-sm font-semibold text-slate-700">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      <PermissionDetailModal isOpen={isDetailModalOpen} onClose={closeDetailModal} permission={selectedPermission} />
    </div>
  );
}

