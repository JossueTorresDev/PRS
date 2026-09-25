import { useState, useEffect } from "react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  ClipboardDocumentListIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Swal from "sweetalert2";
import { usePermissions } from "../../../hooks/usePermissions";
import { getDetailsByInventoryId, deleteInventoryDetail } from "../services/inventoryDetailApi";
import InventoryDetailReport from "../reports/InventoryDetailReport";

const FOUND_STATUS_LABELS = {
  FOUND:   { label: "Encontrado",  color: "bg-green-50 text-green-700 border-green-200",  icon: CheckCircleIcon,        bgColor: "bg-green-500" },
  MISSING: { label: "Faltante",    color: "bg-red-50 text-red-700 border-red-200",        icon: XCircleIcon,            bgColor: "bg-red-500" },
  SURPLUS: { label: "Sobrante",    color: "bg-blue-50 text-blue-700 border-blue-200",     icon: PlusIcon,               bgColor: "bg-blue-500" },
  DAMAGED: { label: "Dañado",      color: "bg-amber-50 text-amber-700 border-amber-200",  icon: ExclamationTriangleIcon, bgColor: "bg-amber-500" }
};

export default function InventoryDetailList({
  inventoryId,
  inventoryStatus,
  inventory = null,
  assets = [],
  onAddDetail,
  onEditDetail,
  onViewDetail
}) {
  const { canDo } = usePermissions();
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Solo puede editar si el inventario está EN PROGRESO y tiene permiso
  const canVerify = canDo('inventario', 'verify', 'scan');
  const canEdit = (inventoryStatus === 'IN_PROGRESS' || inventoryStatus === 'IN_PROCESS') && canVerify;

  useEffect(() => {
    if (inventoryId) {
      loadDetails();
    }
  }, [inventoryId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await getDetailsByInventoryId(inventoryId);
      setDetails(data);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDetails = details.filter(detail => {
    const matchSearch =
      detail.observations?.toLowerCase().includes(search.toLowerCase()) ||
      detail.assetId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || detail.foundStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = {
    todos:   details.length,
    FOUND:   details.filter(d => d.foundStatus === 'FOUND').length,
    MISSING: details.filter(d => d.foundStatus === 'MISSING').length,
    SURPLUS: details.filter(d => d.foundStatus === 'SURPLUS').length,
    DAMAGED: details.filter(d => d.foundStatus === 'DAMAGED').length
  };

  const getStatusBadge = (status) => {
    const config = FOUND_STATUS_LABELS[status] || FOUND_STATUS_LABELS.FOUND;
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

  const handleDelete = async (detail) => {
    if (!canEdit) return;
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (result.isConfirmed) {
      try {
        await deleteInventoryDetail(detail.id);
        Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Registro eliminado correctamente', timer: 1500, showConfirmButton: false });
        loadDetails();
      } catch {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el registro' });
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando detalles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header teal */}
      <div className="bg-teal-600 shadow-lg rounded-2xl px-6 py-5">
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Bienes Verificados</h3>
              <p className="text-teal-100 text-sm">{details.length} registros</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Agregar — solo en IN_PROGRESS */}
            {canEdit && (
              <button
                onClick={onAddDetail}
                className="flex items-center gap-2 px-5 py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar Bien
              </button>
            )}

            {/* Botón Exportar PDF — solo cuando COMPLETED y hay detalles */}
            {inventoryStatus === 'COMPLETED' && details.length > 0 && (
              <PDFDownloadLink
                document={
                  <InventoryDetailReport
                    inventory={inventory}
                    details={details}
                    assets={assets}
                  />
                }
                fileName={`inventario_bienes_${inventory?.inventoryNumber || inventoryId}.pdf`}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 border-2 border-white/70 text-white rounded-xl font-semibold transition-all duration-200 text-sm"
              >
                {({ loading: pdfLoading }) => (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    {pdfLoading ? 'Generando...' : 'Exportar PDF'}
                  </>
                )}
              </PDFDownloadLink>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-4 w-4 text-teal-600" />
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar por código u observaciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500/20 text-sm font-medium"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="todos">Todos ({countByStatus.todos})</option>
              <option value="FOUND">Encontrados ({countByStatus.FOUND})</option>
              <option value="MISSING">Faltantes ({countByStatus.MISSING})</option>
              <option value="SURPLUS">Sobrantes ({countByStatus.SURPLUS})</option>
              <option value="DAMAGED">Dañados ({countByStatus.DAMAGED})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        {filteredDetails.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ClipboardDocumentListIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bienes registrados</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {statusFilter === "todos"
                ? "Aún no se han verificado bienes. Haz clic en 'Agregar Bien' para comenzar."
                : `No hay bienes con estado "${FOUND_STATUS_LABELS[statusFilter]?.label}".`}
            </p>
            {canEdit && (
              <button onClick={onAddDetail} className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">
                <PlusIcon className="h-5 w-5" />
                Agregar primer bien
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-teal-600">
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Estado</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Codigo</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Conservación</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Observaciones</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                    <div className="flex items-center gap-1"><CameraIcon className="h-4 w-4 text-white/80" />Fotos</div>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredDetails.map((detail, index) => {
                  const asset = assets.find(a => a.id === detail.assetId);
                  return (
                    <tr key={detail.id} className={`hover:bg-teal-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-3 py-3">{getStatusBadge(detail.foundStatus)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {asset?.assetCode || asset?.codigoPatrimonial || (detail.assetId ? detail.assetId.slice(-8) : 'Sin asignar')}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-[200px]">
                        <span className="text-sm text-gray-600 truncate block">
                          {asset?.description || asset?.descripcion || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{detail.actualConservationStatus || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[160px]">
                        <span className="text-sm text-gray-600 truncate block">{detail.observations || '-'}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {detail.photographs && detail.photographs.length > 0 ? (
                          <span className="flex items-center text-sm text-green-600 font-medium">
                            <CameraIcon className="h-4 w-4 mr-1" />{detail.photographs.length}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-1">
                          <button onClick={() => onViewDetail(detail)} className="inline-flex items-center p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200" title="Ver detalle">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => onEditDetail(detail)} className="inline-flex items-center p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors duration-200" title="Editar">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(detail)} className="inline-flex items-center p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200" title="Eliminar">
                                <TrashIcon className="h-4 w-4" />
                              </button>
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

        {/* Footer resumen */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-gray-600">Total: <strong className="text-gray-900">{details.length}</strong></span>
            <span className="text-green-600">Encontrados: <strong>{countByStatus.FOUND}</strong></span>
            <span className="text-red-600">Faltantes: <strong>{countByStatus.MISSING}</strong></span>
            <span className="text-blue-600">Sobrantes: <strong>{countByStatus.SURPLUS}</strong></span>
            <span className="text-amber-600">Dañados: <strong>{countByStatus.DAMAGED}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
