import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  DocumentMagnifyingGlassIcon,
  DocumentArrowDownIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Swal from "sweetalert2";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useAuth } from "../../ms-02-authentication/hooks/useAuth";
import InventoryReport from '../reports/InventoryReport';
import InventoryDetailReport from '../reports/InventoryDetailReport';
import { getDetailsByInventoryId } from '../services/inventoryDetailApi';

// Componente para descargar PDF con detalles
const PDFDownloadButton = ({ inventory, municipalityName, areas, categories, locations, users, assets, normalizedStatus }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (normalizedStatus !== 'COMPLETED') return;
    
    setLoading(true);
    try {
      let loadedDetails = [];
      try {
        loadedDetails = await getDetailsByInventoryId(inventory.id);
      } catch (detailError) {
        console.warn('⚠️ No se pudieron cargar los detalles, continuando sin ellos:', detailError);
        loadedDetails = [];
      }
      
      // Los assets ya vienen en props, usarlos directamente
      const element = (
        <InventoryDetailReport 
          inventory={inventory} 
          municipalityName={municipalityName} 
          extraNames={{
            areaName: areas.find(a => a.id === inventory.areaId)?.name || null,
            categoryName: categories.find(c => c.id === inventory.categoryId)?.name || null,
            locationName: locations.find(l => l.id === inventory.locationId)?.name || null,
            responsibleName: (() => {
              const p = users.find(u => u.id === inventory.generalResponsibleId);
              if (!p) return null;
              return `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.personalEmail || null;
            })(),
          }} 
          details={loadedDetails} 
          assets={assets || []}
          locations={locations || []}
          users={users || []}
        />
      );
      
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventario_${inventory.inventoryNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el reporte PDF'
      });
    } finally {
      setLoading(false);
    }
  };

  if (normalizedStatus === 'COMPLETED') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="p-2.5 text-slate-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generar PDF con detalles"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<InventoryDetailReport inventory={inventory} municipalityName={municipalityName} extraNames={{
        areaName: areas.find(a => a.id === inventory.areaId)?.name || null,
        categoryName: categories.find(c => c.id === inventory.categoryId)?.name || null,
        locationName: locations.find(l => l.id === inventory.locationId)?.name || null,
        responsibleName: (() => {
          const p = users.find(u => u.id === inventory.generalResponsibleId);
          if (!p) return null;
          return `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.personalEmail || null;
        })(),
      }} details={[]} assets={[]} />}
      fileName={`inventario_${inventory.inventoryNumber}.pdf`}
      className="p-2.5 text-slate-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-rose-600"
      title="Generar PDF"
    >
      {() => <DocumentArrowDownIcon className="h-4 w-4" />}
    </PDFDownloadLink>
  );
};

const STATUS_LABELS = {
  PLANNED: { label: "Planificado", color: "bg-blue-50 text-blue-700 border-blue-200", icon: ClipboardDocumentListIcon, bgColor: "bg-blue-500" },
  IN_PROGRESS: { label: "En Progreso", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: ClockIcon, bgColor: "bg-yellow-500" },
  COMPLETED: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircleIcon, bgColor: "bg-green-500" },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: XCircleIcon, bgColor: "bg-red-500" }
};

const TYPE_LABELS = {
  GENERAL: "General",
  PARTIAL: "Parcial",
  SELECTIVE: "Selectivo"
};

// Función para normalizar el estado
const normalizeStatus = (status) => {
  if (!status) return 'PLANNED';
  let normalized = String(status).toUpperCase().trim().replace(/\s+/g, '_');
  if (normalized === 'IN_PROCESS') normalized = 'IN_PROGRESS';
  return normalized;
};

// Función para obtener el estado del inventario
const getInventoryStatus = (inventory) => {
  return inventory?.status || inventory?.inventoryStatus;
};

export default function InventoryList({ 
  inventories, 
  onView, 
  onEdit, 
  onDelete, 
  onStart, 
  onComplete, 
  onCreateNew,
  statusFilter,
  onStatusFilterChange,
  areas = [],
  categories = [],
  locations = [],
  users = [],
  assets = [],
  canCreate = false,
  canUpdate = false,
  canDelete = false,
  canVerify = false,
  canClose = false,
}) {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('todos');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Nombre de la municipalidad desde el contexto del usuario; preferir nombre legible almacenado en sessionStorage
  const municipalityName = user?.municipalityName || sessionStorage.getItem('muniName') || user?.municipalCode || 'Municipalidad';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Si se cambia el filtro de estado fuera de COMPLETED, resetear el filtro de año
  useEffect(() => {
    if (statusFilter !== 'COMPLETED' && yearFilter !== 'todos') {
      setYearFilter('todos');
    }
  }, [statusFilter]);

  const statusOptions = [
    { value: 'todos', label: 'Todos', Icon: null },
    { value: 'PLANNED',     label: 'Planificado',  Icon: ClipboardDocumentListIcon },
    { value: 'IN_PROGRESS', label: 'En Progreso',  Icon: ClockIcon },
    { value: 'COMPLETED',   label: 'Completado',   Icon: CheckCircleIcon },
    { value: 'CANCELLED',   label: 'Cancelado',    Icon: XCircleIcon },
  ];
  const selectedOption = statusOptions.find(o => o.value === statusFilter) || statusOptions[0];

  // Construir lista de años disponibles a partir de las fechas de inventarios COMPLETADOS
  const availableYears = Array.from(new Set(inventories
    .filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'COMPLETED')
    .map(inv => {
      // Priorizar campos que representen la fecha de completado/verificación
      const d = inv.completedAt || inv.completed_at || inv.completionDate || inv.completion_date || inv.verificationDate || inv.verification_date || inv.plannedEndDate || inv.plannedEndDate || inv.plannedStartDate || inv.createdAt || inv.created_at;
      if (!d) return null;
      try { return new Date(d).getUTCFullYear(); } catch { return null; }
    }).filter(Boolean))).sort((a,b) => b - a);

  const filteredInventories = inventories.filter(inv => {
    const matchSearch = 
      inv.inventoryNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.description?.toLowerCase().includes(search.toLowerCase());
    const normalizedStatus = normalizeStatus(getInventoryStatus(inv));
    const matchStatus = statusFilter === "todos" || normalizedStatus === statusFilter;
    // Filtrado por año: si yearFilter === 'todos' permitir, si 'sin-fecha' entonces solo aquellos sin fecha
    let matchYear = true;
    if (yearFilter && yearFilter !== 'todos') {
      if (yearFilter === 'sin-fecha') {
        matchYear = !inv.plannedStartDate && !inv.plannedEndDate && !inv.createdAt && !inv.created_at;
      } else {
        const year = Number(yearFilter);
        const d = inv.plannedStartDate || inv.plannedEndDate || inv.createdAt || inv.created_at;
        if (!d) matchYear = false;
        else {
          try { matchYear = (new Date(d).getUTCFullYear() === year); } catch { matchYear = false; }
        }
      }
    }
    return matchSearch && matchStatus && matchYear;
  });

  const countByStatus = {
    todos: inventories.length,
    PLANNED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'PLANNED').length,
    IN_PROGRESS: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'IN_PROGRESS').length,
    COMPLETED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'COMPLETED').length,
    CANCELLED: inventories.filter(inv => normalizeStatus(getInventoryStatus(inv)) === 'CANCELLED').length
  };

  const getStatusBadge = (status) => {
    const config = STATUS_LABELS[status] || STATUS_LABELS.PLANNED;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full ${config.bgColor} mr-2`}></div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
          <IconComponent className="w-3.5 h-3.5 mr-1.5" />
          {config.label}
        </span>
      </div>
    );
  };

  // Función para verificar si el inventario está en el rango de fechas
  const isInDateRange = (inventory) => {
    if (!inventory.plannedStartDate || !inventory.plannedEndDate) {
      return true; // Si no hay fechas, permitir iniciar
    }

    // Obtener fecha actual en UTC (solo año, mes, día)
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    // Obtener fechas del inventario en UTC
    const startDate = new Date(inventory.plannedStartDate);
    const startUTC = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());

    const endDate = new Date(inventory.plannedEndDate);
    const endUTC = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());

    return todayUTC >= startUTC && todayUTC <= endUTC;
  };

  const handleStart = (inventory) => {
    const currentStatus = getInventoryStatus(inventory);
    const normalizedStatus = normalizeStatus(currentStatus);

    if (normalizedStatus !== 'PLANNED') {
      Swal.fire({
        icon: 'warning',
        title: 'Estado Incorrecto',
        text: `Este inventario está en estado "${STATUS_LABELS[normalizedStatus]?.label || normalizedStatus}". Solo se pueden iniciar inventarios en estado "Planificado".`,
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    // Validar rango de fechas
    if (!isInDateRange(inventory)) {
      const formatDateUTC = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      };
      
      const startDate = formatDateUTC(inventory.plannedStartDate);
      const endDate = formatDateUTC(inventory.plannedEndDate);
      
      Swal.fire({
        icon: 'warning',
        title: 'Fuera del Rango de Fechas',
        html: `
          <p>Este inventario solo puede iniciarse dentro del rango programado:</p>
          <div class="mt-3 p-3 bg-gray-50 rounded-lg">
            <p class="font-semibold text-gray-700">📅 Fecha de inicio: ${startDate}</p>
            <p class="font-semibold text-gray-700">📅 Fecha de fin: ${endDate}</p>
          </div>
          <p class="mt-3 text-sm text-gray-600">La fecha actual está fuera de este rango.</p>
        `,
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: "¿Iniciar inventario?",
      text: `Se iniciará el inventario ${inventory.inventoryNumber}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, iniciar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onStart(inventory.id);
      }
    });
  };

  const handleComplete = (inventory) => {
    const currentStatus = getInventoryStatus(inventory);
    const normalizedStatus = normalizeStatus(currentStatus);

    if (normalizedStatus !== 'IN_PROGRESS') {
      Swal.fire({
        icon: 'warning',
        title: 'Estado Incorrecto',
        text: `Este inventario está en estado "${STATUS_LABELS[normalizedStatus]?.label || normalizedStatus}". Solo se pueden completar inventarios en estado "En Progreso".`,
        confirmButtonColor: '#4f46e5'
      });
      return;
    }

    Swal.fire({
      title: "¿Completar inventario?",
      text: `Se marcará como completado el inventario ${inventory.inventoryNumber}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, completar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onComplete(inventory.id);
      }
    });
  };

  const handleDelete = (inventory) => {
    Swal.fire({
      title: "¿Eliminar inventario?",
      text: `Se eliminará el inventario ${inventory.inventoryNumber}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(inventory.id);
      }
    });
  };

  return (
    <>
      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${statusFilter === 'COMPLETED' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          {/* Buscar */}
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
                placeholder="Buscar por número o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/20 transition-all text-sm font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center gap-2.5 pl-3 pr-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium text-sm hover:bg-gray-100 transition-all"
              >
                {selectedOption.Icon ? (
                  <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                    <selectedOption.Icon className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                )}
                <span className="flex-1 text-left truncate">{selectedOption.label}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {statusOptions.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { onStatusFilterChange(value); setDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-teal-50 transition-colors ${statusFilter === value ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'}`}
                    >
                      {Icon ? (
                        <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <svg className="h-3.5 w-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Año: mostrar solo cuando se está filtrando por COMPLETED */}
          {statusFilter === 'COMPLETED' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Año</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-3 pr-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium text-sm hover:bg-gray-100 transition-all"
            >
              <option value="todos">Todos</option>
              {availableYears.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
              <option value="sin-fecha">Sin Fecha</option>
            </select>
          </div>
          )}
          {/* Exportar */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Exportar</label>
            <PDFDownloadLink
              document={<InventoryReport inventories={filteredInventories} municipalityName={municipalityName} />}
              fileName={`reporte_inventarios_${new Date().toISOString().slice(0, 10)}.pdf`}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl text-slate-900 font-medium hover:bg-teal-600 hover:text-white transition-all text-sm group/btn"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <DocumentArrowDownIcon className="w-5 h-5 text-teal-600 group-hover/btn:text-white flex-shrink-0 transition-colors" />
                  {pdfLoading ? 'Preparando...' : 'Exportar PDF'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
      {filteredInventories.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay inventarios</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {statusFilter === "todos" 
              ? "Aún no se han creado inventarios. Haz clic en 'Nuevo Inventario' para crear el primero."
              : `No hay inventarios en estado "${STATUS_LABELS[statusFilter]?.label}".`
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-teal-600">
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2 text-white/80" />
                    Número
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-white/80" />
                    Fecha Inicio
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredInventories.map((inventory, index) => {
                const normalizedStatus = normalizeStatus(getInventoryStatus(inventory));
                return (
                  <tr key={inventory.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{inventory.inventoryNumber}</div>
                          <div className="text-xs text-gray-500">ID: {inventory.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                          <TagIcon className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="text-sm text-gray-900 font-medium">{TYPE_LABELS[inventory.inventoryType] || inventory.inventoryType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0 flex-shrink-0">
                          <DocumentTextIcon className="h-3.5 w-3.5 text-teal-600" />
                        </div>
                        <span className="text-sm text-gray-900 truncate max-w-[200px]" title={inventory.description}>{inventory.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 font-medium">
                          {inventory.plannedStartDate ? (() => {
                            const date = new Date(inventory.plannedStartDate);
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const year = date.getUTCFullYear();
                            return `${day}/${month}/${year}`;
                          })() : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {getStatusBadge(normalizedStatus)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => onView(inventory)}
                          className="p-2.5 text-slate-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-600"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <PDFDownloadButton 
                          inventory={inventory}
                          municipalityName={municipalityName}
                          areas={areas}
                          categories={categories}
                          locations={locations}
                          users={users}
                          assets={assets}
                          normalizedStatus={normalizedStatus}
                        />
                        
                        {normalizedStatus === 'PLANNED' && (
                          <>
                            {canUpdate && (
                            <button
                              onClick={() => onEdit(inventory)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-emerald-600"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            )}
                            
                            {canVerify && (
                            <button
                              onClick={() => handleStart(inventory)}
                              disabled={!isInDateRange(inventory)}
                              className={`p-2.5 rounded-lg transition-all duration-200 border ${isInDateRange(inventory) ? "text-slate-600 hover:text-white hover:bg-purple-600 border-slate-200 hover:border-purple-600 cursor-pointer" : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed opacity-50"}`}
                              title={
                                isInDateRange(inventory)
                                  ? 'Iniciar inventario'
                                  : (() => {
                                      const formatDateUTC = (dateString) => {
                                        const date = new Date(dateString);
                                        const day = String(date.getUTCDate()).padStart(2, '0');
                                        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                        const year = date.getUTCFullYear();
                                        return `${day}/${month}/${year}`;
                                      };
                                      return `Fuera del rango de fechas (${formatDateUTC(inventory.plannedStartDate)} - ${formatDateUTC(inventory.plannedEndDate)})`;
                                    })()
                              }
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                            )}
                            
                            {canDelete && (
                            <button
                              onClick={() => handleDelete(inventory)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-red-600"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                            )}
                          </>
                        )}
                        
                        {normalizedStatus === 'IN_PROGRESS' && (
                          <>
                            {canVerify && (
                            <button
                              onClick={() => navigate(`/inventarios/${inventory.id}/detalles`)}
                              className="p-2.5 text-slate-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-indigo-600"
                              title="Verificar bienes"
                            >
                              <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                            </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </>
  );
}













