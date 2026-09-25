import { useEffect, useState } from "react";
import { FaBan, FaCheckCircle, FaEdit, FaEye, FaLayerGroup, FaTrash, FaUndo } from "react-icons/fa";
import Swal from "sweetalert2";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { deleteArea, getAllAreas, getInactiveAreas, restoreArea } from "../../services/areasApi";
import AreaDetailModal from "./AreaDetailModal";
import AreaModal from "./AreaModal";
import AreaReport from "../../reports/AreaReport";
import AreaDetailReport from "../../reports/AreaDetailReport";
import ContentLoading from "../../../../shared/utils/ContentLoading";
export default function AreasPage() {
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("activos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  // Mismo patrón que MovementsPage: primero sessionStorage.user, luego JWT
  const municipalityId = (() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || 'null');
      if (user?.municipalCode) return user.municipalCode;
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.municipal_code || payload.municipalCode || payload.municipality_id || null;
      }
    } catch { /* skip */ }
    return null;
  })();

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      let data;
      if (filter === 'inactivos') {
        data = await getInactiveAreas();
      } else {
        data = await getAllAreas();
      }
      let all = Array.isArray(data) ? data : [];
      // Mismo patrón condicional que MovementsPage para áreas
      if (all.length > 0 && municipalityId) {
        if (all[0].municipalityId !== undefined) {
          const byMunicipality = all.filter(a => a.municipalityId === municipalityId);
          all = byMunicipality.length > 0 ? byMunicipality : all;
        }
      }
      setItems(all);
      // refresh metrics independently of current filter
      try { await loadMetrics(); } catch (e) { /* ignore */ }
    } catch (e) {
      setError(e?.message || "Error cargando áreas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [municipalityId, filter]);
  const isActive = (x) => {
    if (!x) return false;
    // Common boolean flags
    if (typeof x.active !== 'undefined') return !!x.active;
    if (typeof x.activo !== 'undefined') return !!x.activo;
    if (typeof x.isActive !== 'undefined') return !!x.isActive;
    // Numeric flags (1/0)
    if (typeof x.status === 'number') return x.status === 1;
    if (typeof x.estado === 'number') return x.estado === 1;
    // String flags
    if (typeof x.status === 'string') {
      const s = x.status.toLowerCase();
      if (s === 'activo' || s === 'active' || s === '1' || s === 'true') return true;
      return false;
    }
    if (typeof x.estado === 'string') {
      const s = x.estado.toLowerCase();
      if (s === 'activo' || s === 'active' || s === '1' || s === 'true') return true;
      return false;
    }
    // Soft-delete detection
    if (typeof x.deletedAt !== 'undefined' && x.deletedAt) return false;
    if (typeof x.deleted_at !== 'undefined' && x.deleted_at) return false;
    // Default fallback: treat as active if not explicitly falsey
    return !!(x.active || x.activo || x.isActive);
  };
  const handleCreate = () => {
    setSelectedArea(null);
    setIsModalOpen(true);
  };
  const handleEdit = (area) => {
    setSelectedArea(area);
    setIsModalOpen(true);
  };
  const handleViewDetail = (area) => {
    setSelectedArea(area);
    setIsDetailModalOpen(true);
  };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArea(null);
  };
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedArea(null);
  };
  const handleSuccess = () => {
    load();
    loadMetrics().catch(() => {});
  };
  const onDelete = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Inactivar área?",
      html: `<div class="text-center"><div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></div><p class="text-slate-600">El área <strong>${row.name || ''}</strong> se marcará como inactiva.</p></div>`,
      icon: null,
      showCancelButton: true,
      confirmButtonText: "Sí, inactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-red-600 text-white hover:bg-red-700",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-gray-200 text-gray-700",
      },
    });
    if (!res.isConfirmed) return;
    await deleteArea(row.id);
    setFilter("inactivos");
    await load();
    await loadMetrics();
    await Swal.fire({
      title: "¡Inactivada!",
      text: "El área fue marcada como inactiva.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl shadow-2xl" },
    });
  };
  const onRestore = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Restaurar área?",
      html: `<div class="text-center"><div class="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div><p class="text-slate-600">El área <strong>${row.name || ''}</strong> estará activa nuevamente.</p></div>`,
      icon: null,
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-emerald-600 text-white hover:bg-emerald-700",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-gray-200 text-gray-700",
      },
    });
    if (!res.isConfirmed) return;
    await restoreArea(row.id);
    setFilter("activos");
    await load();
    await loadMetrics();
    await Swal.fire({
      title: "¡Restaurada!",
      text: "El área fue restaurada correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl shadow-2xl" },
    });
  };

  const loadMetrics = async () => {
    try {
      const [actives, inactives] = await Promise.all([getAllAreas(), getInactiveAreas()]);
      const a = Array.isArray(actives) ? actives.length : 0;
      const i = Array.isArray(inactives) ? inactives.length : 0;
      setMetrics({ total: a + i, active: a, inactive: i });
    } catch (err) {
      // fallback: derive from current items using isActive
      try {
        const total = items.length;
        const active = items.filter(isActive).length;
        const inactive = total - active;
        setMetrics({ total, active, inactive });
      } catch (e) { /* ignore */ }
    }
  };
  const filtered = items.filter((x) => {
    const matchesSearch =
      (x.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (x.areaCode || "").toLowerCase().includes(search.toLowerCase());
    if (filter === "todos") return matchesSearch;
    if (filter === "activos") return matchesSearch && isActive(x);
    return matchesSearch && !isActive(x);
  });
  const filteredSorted = [...filtered].sort((a, b) => {
    const ac = String(a.code || "");
    const bc = String(b.code || "");
    const anum = parseInt((ac.match(/\d+/) || ["999999"])[0], 10);
    const bnum = parseInt((bc.match(/\d+/) || ["999999"])[0], 10);
    if (!isNaN(anum) && !isNaN(bnum) && anum !== bnum) return anum - bnum;
    return ac.localeCompare(bc, undefined, { numeric: true, sensitivity: "base" });
  });
  const total = items.length;
  const totalActivas = items.filter((x) => isActive(x)).length;
  const totalInactivas = total - totalActivas;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {loading && (
        <div className="relative min-h-[400px]">
          <ContentLoading isLoading={true} message="Cargando áreas..." />
        </div>
      )}
      {!loading && (<>
      {}
      <div className="bg-emerald-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <FaLayerGroup className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Gestión de Áreas
                </h1>
                <p className="text-emerald-100 text-sm font-medium">
                  Administración de áreas organizacionales
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Área
              </button>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {}
          <div className="bg-white border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Áreas</p>
                <p className="text-3xl font-bold text-slate-800">{metrics.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-500">
                <FaLayerGroup className="w-6 h-6" />
              </div>
            </div>
          </div>
          {}
          <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activas</p>
                <p className="text-3xl font-bold text-slate-800">{metrics.active}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                <FaCheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          {}
          <div className="bg-white border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivas</p>
                <p className="text-3xl font-bold text-slate-800">{metrics.inactive}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                <FaBan className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Buscar</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </div>
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              >
                <option value="todos">Todas</option>
                <option value="activos">Activas</option>
                <option value="inactivos">Inactivas</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Exportar</label>
            <PDFDownloadLink
              document={<AreaReport areas={filteredSorted} />}
              fileName={`reporte_areas_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium hover:bg-emerald-600 hover:text-white transition-all text-sm group/btn"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <svg className="w-5 h-5 text-emerald-600 group-hover/btn:text-white flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                  </svg>
                  {pdfLoading ? 'Preparando...' : 'Exportar PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
              <thead className="bg-emerald-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Nivel</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                          <FaLayerGroup className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron áreas</p>
                        <p className="text-slate-500">Intenta con otros filtros o agrega una nueva área</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map((row) => (
                    <tr
                      key={row.id}
                      className="group hover:bg-emerald-50/40 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-emerald-500 bg-white"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:shadow-md transition-all duration-200">
                            <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{row.areaCode || "—"}</p>
                            <p className="text-xs text-slate-400">Código</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                            <FaLayerGroup className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{row.name || "—"}</p>
                            {row.physicalLocation && (
                              <p className="text-xs text-slate-400 mt-0.5">{row.physicalLocation}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                          </div>
                          <p className="text-sm text-slate-600 max-w-[220px] truncate" title={row.description}>
                            {row.description || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {row.hierarchicalLevel != null ? `N° ${row.hierarchicalLevel}` : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {isActive(row) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Inactiva
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                            title="Ver detalles"
                            aria-label="Ver detalles"
                            onClick={(e) => { e.stopPropagation(); handleViewDetail(row); }}
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <PDFDownloadLink
                            document={<AreaDetailReport area={row} />}
                            fileName={`area_${row.areaCode || row.id}.pdf`}
                            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title="Generar reporte PDF"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {() => (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                              </svg>
                            )}
                          </PDFDownloadLink>
                          <button
                            type="button"
                            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title="Editar"
                            aria-label="Editar"
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          {!isActive(row) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onRestore(row); }}
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                              title="Restaurar"
                            >
                              <FaUndo className="w-4 h-4" />
                            </button>
                          )}
                          {isActive(row) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              title="Inactivar"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>
      {}
      <AreaModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        area={selectedArea}
      />
      <AreaDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        area={selectedArea}
      />
      </>)}
    </div>
  );
}
