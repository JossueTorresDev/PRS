import { useEffect, useState, useRef } from "react";
import {
  getAllActivePositions,
  getAllInactivePositions,
  deletePosition,
  restorePosition,
} from "../../services/positionApi";
import PositionForm from "./PositionForm";
import PositionDetails from "./PositionDetails";
import Swal from "sweetalert2";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PositionReport from "../../reports/PositionReport";
import PositionDetailReport from "../../reports/PositionDetailReport";
import { CurrencyDollarIcon, CalendarIcon, IdentificationIcon, ChatBubbleBottomCenterTextIcon, BuildingOffice2Icon } from "@heroicons/react/24/solid";
import { usePermissions } from "../../../../hooks/usePermissions";
import ContentLoading from "../../../../shared/utils/ContentLoading";
const PositionList = () => {
  const [positions, setPositions] = useState([]);
  const [editingPosition, setEditingPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterActive, setFilterActive] = useState('active'); // 'active', 'inactive', null = todos
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const { canDo } = usePermissions();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const statusOptions = [
    { value: 'active', label: 'Activo', icon: (
      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { value: 'inactive', label: 'Inactivo', icon: (
      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    )},
    { value: null, label: 'Todos', icon: (
      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7-4a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];


  const selectedStatus = statusOptions.find(o => o.value === filterActive);
  // Mismo patrón condicional que MovementsPage para cargos
  const fetchPositions = async () => {
    try {
      setLoading(true);
      const [active, inactive] = await Promise.all([
        getAllActivePositions(),
        getAllInactivePositions(),
      ]);
      let todosPositions = [...active, ...inactive];
      if (todosPositions.length > 0 && municipalityId) {
        if (todosPositions[0].municipalityId !== undefined) {
          const byMunicipality = todosPositions.filter(p => p.municipalityId === municipalityId);
          todosPositions = byMunicipality.length > 0 ? byMunicipality : todosPositions;
        }
      }
      setPositions(todosPositions);
      setStats({
        active: todosPositions.filter(p => p.active).length,
        inactive: todosPositions.filter(p => !p.active).length,
        total: todosPositions.length,
      });
    } catch (err) {
      console.error("Error fetching positions:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPositions();
  }, [municipalityId]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterActive]);
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Desactivar cargo?",
      html: `
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p class="text-slate-600">El cargo se marcará como inactivo.</p>
        </div>
      `,
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
    if (result.isConfirmed) {
      try {
        await deletePosition(id);
        await fetchPositions();
        Swal.fire({ title: "¡Desactivado!", text: "El cargo se desactivó correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      } catch {
        Swal.fire("Error", "No se pudo desactivar el cargo.", "error");
      }
    }
  };
  const handleRestore = async (id) => {
    const result = await Swal.fire({
      title: "¿Restaurar cargo?",
      text: "El cargo estará activo nuevamente.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      try {
        await restorePosition(id);
        await fetchPositions();
        Swal.fire({ title: "¡Restaurado!", text: "El cargo se restauró correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
      } catch {
        Swal.fire("Error", "No se pudo restaurar el cargo.", "error");
      }
    }
  };
  const openAddModal = () => {
    setEditingPosition(null);
    setShowModal(true);
  };
  const openEditModal = (position) => {
    setEditingPosition(position);
    setShowModal(true);
  };
  const handleFormSuccess = () => {
    fetchPositions();
    setEditingPosition(null);
    setShowModal(false);
  };
  const openDetailsModal = (position) => {
    setSelectedPosition(position);
    setShowDetails(true);
  };
  const filteredPositions = positions.filter((position) => {
    let matchesFilter = true;
    if (filterActive === 'active') {
      matchesFilter = position.active;
    } else if (filterActive === 'inactive') {
      matchesFilter = !position.active;
    }
    // Si filterActive es null, muestra todos (matchesFilter sigue siendo true)
   
    const matchesSearch =
      position.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.positionCode?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPositions = filteredPositions.slice(startIndex, startIndex + itemsPerPage);
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const dateFormatted = new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
    const timeFormatted = new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
    return `${dateFormatted} ${timeFormatted}`;
  };
  if (loading) {
    return (
      <div className="relative min-h-[400px]">
        <ContentLoading isLoading={true} message="Cargando cargos..." />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      {}
      <div className="bg-blue-600 shadow-lg mb-8 rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Cargos</h1>
                <p className="text-blue-100 text-sm font-medium">Administración de cargos del sistema</p>
              </div>
            </div>
            <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
                style={{ display: canDo('config', 'areas', 'manage') ? undefined : 'none' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Cargo
              </button>
          </div>
        </div>
      </div>
      {}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Cargos</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Activos</p>
                <p className="text-3xl font-bold text-slate-800">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inactivos</p>
                <p className="text-3xl font-bold text-slate-800">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="text"
                placeholder="Nombre o código del cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium text-sm hover:bg-gray-100 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  {selectedStatus.icon}
                </div>
                <span className="flex-1 text-left">{selectedStatus.label}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {statusOptions.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setFilterActive(value); setStatusDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${filterActive === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Exportar</label>
            <PDFDownloadLink
              document={<PositionReport positions={filteredPositions} />}
              fileName={`reporte_cargos_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium hover:bg-blue-600 hover:text-white transition-all text-sm group/btn"
            >
              {({ loading }) => (
                <>
                  <svg className="w-5 h-5 text-blue-600 group-hover/btn:text-white flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                  </svg>
                  {loading ? "Preparando..." : "Exportar PDF"}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
      {}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="w-full">
          <table className="w-full table-fixed">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Nombre del Cargo</th>
                <th className="px-3 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Nivel</th>
                <th className="px-3 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Salario Base</th>
                <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Fecha Creación</th>
                <th className="px-3 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron cargos</p>
                      <p className="text-slate-500">Intenta con otros filtros o agrega un nuevo cargo</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPositions.map((position) => (
                  <tr key={position.id} className="group hover:bg-blue-50/30 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:shadow-md transition-all duration-200">
                          <svg className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{position.positionCode}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Código</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <IdentificationIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm leading-tight">{position.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Cargo</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <p className="text-sm text-slate-600 max-w-[120px] truncate" title={position.description}>{position.description}</p>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <BuildingOffice2Icon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{position.hierarchicalLevel ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <CurrencyDollarIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">S/. {position.baseSalary?.toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Soles</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{formatDate(position.createdAt).split(' ')[0]}</p>
                          <p className="text-xs text-slate-400">{formatDate(position.createdAt).split(' ')[1]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailsModal(position)}
                          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          title="Ver detalles"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <PDFDownloadLink
                          document={<PositionDetailReport position={position} />}
                          fileName={`cargo_${position.positionCode}.pdf`}
                          className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          title="Generar reporte PDF"
                        >
                          {() => (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
                            </svg>
                          )}
                        </PDFDownloadLink>
                        {position.active ? (
                          <>
                            {canDo('config', 'areas', 'manage') && (
                            <button
                              onClick={() => openEditModal(position)}
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            )}
                            {canDo('config', 'areas', 'manage') && (
                            <button
                              onClick={() => handleDelete(position.id)}
                              className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              title="Desactivar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            )}
                          </>
                        ) : (
                          canDo('config', 'areas', 'manage') && (
                          <button
                            onClick={() => handleRestore(position.id)}
                            className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title="Restaurar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {}
        {filteredPositions.length > itemsPerPage && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPositions.length)} de {filteredPositions.length} cargos
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      {}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col border border-gray-100">
            <div className="px-8 py-6 border-b border-blue-100 flex-shrink-0 flex justify-between items-center bg-blue-600 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{editingPosition ? "Editar Cargo" : "Nuevo Cargo"}</h2>
                  <p className="text-blue-100 text-sm mt-1">{editingPosition ? "Actualiza la información del cargo" : "Completa los datos para crear un nuevo cargo"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <PositionForm position={editingPosition} positions={positions} onSuccess={handleFormSuccess} onCancel={() => setShowModal(false)} />
            </div>
          </div>
        </div>
      )}
      {}
      {showDetails && selectedPosition && (
        <PositionDetails
          position={selectedPosition}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};
export default PositionList;

