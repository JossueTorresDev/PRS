import { useEffect, useState } from "react";
import { getAllPhysicalLocations, deletePhysicalLocation, getInactivePhysicalLocations, restorePhysicalLocation } from "../../services/physicalLocationApi";
import Swal from "sweetalert2";
import { FaTrash, FaCheckCircle, FaBan, FaUndo, FaMapMarkerAlt, FaEdit, FaEye } from "react-icons/fa";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PhysicalLocationReport from "../../reports/PhysicalLocationReport";
import PhysicalLocationDetailReport from "../../reports/PhysicalLocationDetailReport";
import PhysicalLocationForm from "./PhysicalLocationForm";
import PhysicalLocationDetail from "./PhysicalLocationDetail";
import ContentLoading from "../../../../shared/utils/ContentLoading";
export default function PhysicalLocationPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [inactiveItems, setInactiveItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [nextCode, setNextCode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

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
      const [locations, inactives] = await Promise.all([
        getAllPhysicalLocations(),
        getInactivePhysicalLocations(),
      ]);
      let allActive = Array.isArray(locations) ? locations : [];
      let allInactive = Array.isArray(inactives) ? inactives : [];
      // Mismo patrón condicional que MovementsPage para ubicaciones
      if (allActive.length > 0 && municipalityId) {
        if (allActive[0].municipalityId !== undefined) {
          const byMunicipality = allActive.filter(l => l.municipalityId === municipalityId);
          allActive = byMunicipality.length > 0 ? byMunicipality : allActive;
        }
      }
      if (allInactive.length > 0 && municipalityId) {
        if (allInactive[0].municipalityId !== undefined) {
          const byMunicipality = allInactive.filter(l => l.municipalityId === municipalityId);
          allInactive = byMunicipality.length > 0 ? byMunicipality : allInactive;
        }
      }
      setItems(allActive);
      setInactiveItems(allInactive);
    } catch (e) {
      setError(e?.message || "Error cargando ubicaciones físicas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [municipalityId]);
  const onEdit = (row) => { setSelectedLocation(row); setIsFormOpen(true); };
  const onView = (row) => { setSelectedLocation(row); setIsDetailOpen(true); };
  const openCreate = async () => {
    await load();
    setSelectedLocation(null);
    setNextCode(nextLocationCode());
    setIsFormOpen(true);
  };
  const onDelete = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Desactivar ubicación?",
      html: `<div class="text-center"><div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></div><p class="text-slate-600">La ubicación <strong>${row.name || ''}</strong> se marcará como inactiva.</p></div>`,
      icon: null,
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-red-600 text-white hover:bg-red-700",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-gray-200 text-gray-700",
      },
    });
    if (!res.isConfirmed) return;
    await deletePhysicalLocation(row.id);
    await Swal.fire({ title: "¡Desactivada!", text: "La ubicación fue marcada como inactiva.", icon: "success", timer: 2000, showConfirmButton: false, customClass: { popup: "rounded-2xl shadow-2xl" } });
    await load();
  };
  const onRestore = async (row) => {
    if (!row?.id) return;
    const res = await Swal.fire({
      title: "¿Restaurar ubicación?",
      html: `<div class="text-center"><div class="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div><p class="text-slate-600">La ubicación <strong>${row.name || ''}</strong> estará activa nuevamente.</p></div>`,
      icon: null,
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-slate-200",
        confirmButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-teal-600 text-white hover:bg-teal-700",
        cancelButton: "rounded-lg px-6 py-2.5 font-medium shadow-sm bg-gray-200 text-gray-700",
      },
    });
    if (!res.isConfirmed) return;
    await restorePhysicalLocation(row.id);
    await Swal.fire({ title: "¡Restaurada!", text: "La ubicación fue restaurada correctamente.", icon: "success", timer: 2000, showConfirmButton: false, customClass: { popup: "rounded-2xl shadow-2xl" } });
    await load();
  };
  const isInactiveFlag = (x) => (x?.active === false || x?.activo === false);
  const activesList = items.filter((x) => !isInactiveFlag(x));
  const derivedInactiveFromItems = items.filter((x) => isInactiveFlag(x));
  const inactivesList = (inactiveItems && inactiveItems.length > 0) ? inactiveItems : derivedInactiveFromItems;
  const allCombined = (() => {
    const map = new Map();
    for (const it of [...items, ...inactivesList]) {
      if (!map.has(it.id)) map.set(it.id, it);
    }
    return Array.from(map.values());
  })();
  const baseList = statusFilter === "inactive" ? inactivesList : (statusFilter === "active" ? activesList : allCombined);
  const filtered = baseList.filter((x) =>
    (x.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (x.locationCode || "").toLowerCase().includes(search.toLowerCase())
  );
  const filteredSorted = [...filtered].sort((a, b) => {
    const ac = String(a.locationCode || "");
    const bc = String(b.locationCode || "");
    const anum = Number.parseInt((ac.match(/\d+/) || ["999999"])[0], 10);
    const bnum = Number.parseInt((bc.match(/\d+/) || ["999999"])[0], 10);
    if (!Number.isNaN(anum) && !Number.isNaN(bnum) && anum !== bnum) return anum - bnum;
    return ac.localeCompare(bc, undefined, { numeric: true, sensitivity: "base" });
  });
  const nextLocationCode = () => {
    const prefix = "LOC-";
    let maxNum = 0;
    // Combina activos e inactivos de todos los municipios visibles
    const allItems = [...items, ...inactiveItems];
    allItems.forEach(item => {
      if (item.locationCode) {
        // Busca cualquier patrón LOC-NNN, no solo del municipio actual
        const match = item.locationCode.toUpperCase().match(/^LOC-(\d+)/);
        if (match) {
          const num = Number.parseInt(match[1], 10);
          if (!Number.isNaN(num)) {
            maxNum = Math.max(maxNum, num);
          }
        }
      }
    });
    // Agrega un timestamp para garantizar unicidad si hay colisión entre municipios
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {/* Header */}
      <div className="bg-teal-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <FaMapMarkerAlt className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Ubicaciones Físicas</h1>
                <p className="text-teal-100 text-sm font-medium">Administración de ubicaciones físicas</p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              onClick={openCreate}            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Ubicación
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative min-h-[400px]">
          <ContentLoading isLoading={true} message="Cargando ubicaciones físicas..." />
        </div>
      ) : (
      <>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Stats */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-l-4 border-l-teal-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Ubicaciones</p>
                <p className="text-3xl font-bold text-slate-800">{allCombined.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-teal-50 text-teal-500">
                <FaMapMarkerAlt className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activas</p>
                <p className="text-3xl font-bold text-slate-800">{activesList.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                <FaCheckCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivas</p>
                <p className="text-3xl font-bold text-slate-800">{inactivesList.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                <FaBan className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Buscar</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm font-medium"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Exportar</label>
            <PDFDownloadLink
              document={<PhysicalLocationReport locations={filteredSorted} />}
              fileName={`reporte_ubicaciones_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium hover:bg-teal-600 hover:text-white transition-all text-sm group/btn"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <svg className="w-5 h-5 text-teal-600 group-hover/btn:text-white flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
              <thead className="bg-teal-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Dirección</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Piso</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6">
                          <FaMapMarkerAlt className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron ubicaciones</p>
                        <p className="text-slate-500">Intenta con otros filtros o agrega una nueva ubicación</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map((row) => {
                    const isInactive = (row.active === false || row.activo === false) || inactiveItems.some(it => it.id === row.id);
                    const locTypeLabel = { OFFICE: 'Oficina', WAREHOUSE: 'Almacén', FIELD: 'Campo', VEHICLE: 'Vehículo', STORAGE: 'Almacenamiento', WORKSHOP: 'Taller' }[row.locationType] || row.locationType || '—';
                    return (
                      <tr key={row.id} className="group hover:bg-teal-50/40 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-teal-500 bg-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{row.locationCode || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                              <FaMapMarkerAlt className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <p className="font-semibold text-slate-900 text-sm">{row.name || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <p className="text-sm text-slate-600">{locTypeLabel}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 max-w-[180px] truncate" title={row.address}>{row.address || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.floor != null ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-sm font-bold border border-teal-200">{row.floor}</span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {isInactive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Inactiva
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>Activa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button"
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                              title="Ver detalles" onClick={() => onView(row)}>
                              <FaEye className="w-4 h-4" />
                            </button>
                            <PDFDownloadLink
                              document={<PhysicalLocationDetailReport location={row} />}
                              fileName={`ubicacion_${row.locationCode || row.id}.pdf`}
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                              title="Exportar PDF"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {() => (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                                </svg>
                              )}
                            </PDFDownloadLink>
                            {!isInactive ? (
                              <>
                                <button type="button"
                                  className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                  title="Editar" onClick={() => onEdit(row)}>
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button type="button"
                                  className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                                  title="Desactivar" onClick={() => onDelete(row)}>
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button type="button"
                                className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                                title="Restaurar" onClick={() => onRestore(row)}>
                                <FaUndo className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>
      </div>

      <PhysicalLocationForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedLocation(null); }}
        onSuccess={load}
        location={selectedLocation}
        nextCode={nextCode}
      />

      <PhysicalLocationDetail
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedLocation(null); }}
        location={selectedLocation}
      />
      </>)}
    </div>
  );
}
