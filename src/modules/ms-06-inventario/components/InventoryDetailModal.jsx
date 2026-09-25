import {
  XMarkIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  InformationCircleIcon,
  MapPinIcon,
  TagIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CameraIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getDetailsByInventoryId } from '../services/inventoryDetailApi';
import InventoryDetailViewModal from './InventoryDetailViewModal';

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PLANNED:     { label: 'Planificado', color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: ClipboardDocumentListIcon, bgColor: 'bg-blue-500' },
  IN_PROGRESS: { label: 'En Progreso', color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: ClockIcon,                 bgColor: 'bg-amber-500' },
  COMPLETED:   { label: 'Completado',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon,        bgColor: 'bg-emerald-500' },
  CANCELLED:   { label: 'Cancelado',   color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircleIcon,               bgColor: 'bg-red-500' },
};

const TYPE_LABELS = { GENERAL: 'General', PARTIAL: 'Parcial', SELECTIVE: 'Selectivo' };

const FOUND_BADGE  = { FOUND: 'bg-green-100 text-green-700 border-green-200', MISSING: 'bg-red-100 text-red-700 border-red-200', SURPLUS: 'bg-yellow-100 text-yellow-700 border-yellow-200', DAMAGED: 'bg-orange-100 text-orange-700 border-orange-200' };
const FOUND_LABEL  = { FOUND: 'Encontrado', MISSING: 'Faltante', SURPLUS: 'Sobrante', DAMAGED: 'Dañado' };

// ── Utilidades ────────────────────────────────────────────────────────────────
const normalizeStatus = (s) => {
  if (!s) return 'PLANNED';
  const n = String(s).toUpperCase().replace(/\s+/g, '_');
  return n === 'IN_PROCESS' ? 'IN_PROGRESS' : n;
};

const formatDate = (d) => {
  if (!d) return 'N/A';
  try { const [y, m, day] = d.split('T')[0].split('-'); return `${day}/${m}/${y}`; }
  catch { return 'N/A'; }
};

const formatDateTime = (d) => {
  if (!d) return 'N/A';
  try {
    const date = new Date(d);
    const h = date.getHours(), mi = date.getMinutes(), s = date.getSeconds();
    return (h === 0 && mi === 0 && s === 0) ? date.toLocaleDateString('es-ES') : date.toLocaleString('es-ES');
  } catch { return 'N/A'; }
};

const safeStr = (v, def = '') => {
  if (v === null || v === undefined || typeof v === 'object') return def;
  return String(v);
};

const parseArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const openPhoto = (url, i) => {
  if (!url) return;
  const w = window.open();
  w.document.write(`<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain"/></body></html>`);
  w.document.close();
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="bg-teal-600 px-6 py-4 flex items-center gap-3">
    <div className="bg-white/20 p-2 rounded-xl"><Icon className="h-5 w-5 text-white" /></div>
    <h4 className="text-base font-bold text-white uppercase tracking-wider">{title}</h4>
  </div>
);

const InfoField = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
      <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  </div>
);

// ── Componente principal ──────────────────────────────────────────────────────
export default function InventoryDetailModal({
  isOpen,
  onClose,
  inventory,
  areaName,
  categoryName,
  locationName,
  responsibleName,
  assets = [],
  locations = [],
  users = [],
  systemUsers = [],
}) {
  const [details, setDetails]           = useState([]);
  const [loadingDetails, setLoading]    = useState(false);
  const [viewingDetail, setViewingDetail] = useState(null);

  useEffect(() => {
    if (!isOpen || !inventory?.id) { setDetails([]); setLoading(false); return; }
    const st = normalizeStatus(inventory.status || inventory.inventoryStatus);
    if (st === 'COMPLETED') {
      setLoading(true);
      getDetailsByInventoryId(inventory.id)
        .then(d => setDetails(Array.isArray(d) ? d : []))
        .catch(() => setDetails([]))
        .finally(() => setLoading(false));
    } else {
      setDetails([]);
    }
  }, [isOpen, inventory?.id, inventory?.status, inventory?.inventoryStatus]);

  // Guard DESPUÉS de los hooks
  if (!isOpen || !inventory) return null;

  // Preparar datos
  const invNumber       = safeStr(inventory.inventoryNumber, 'N/A');
  const invType         = safeStr(inventory.inventoryType, 'N/A');
  const invDesc         = safeStr(inventory.description, 'Sin descripción');
  const invObs          = safeStr(inventory.observations, '');
  const invTeam         = safeStr(inventory.inventoryTeam, '');
  const photographs     = parseArray(inventory.photographs);   // ← siempre array seguro
  const safeArea        = typeof areaName === 'string'        ? areaName        : null;
  const safeCat         = typeof categoryName === 'string'    ? categoryName    : null;
  const safeLoc         = typeof locationName === 'string'    ? locationName    : null;
  const safeResp        = typeof responsibleName === 'string' ? responsibleName : null;
  const normalizedStatus = normalizeStatus(inventory.status || inventory.inventoryStatus);
  const statusCfg       = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PLANNED;
  const StatusIcon      = statusCfg.icon;

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="bg-teal-600 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ClipboardDocumentListIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Inventario Físico</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold">{invNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* Columna principal */}
            <div className="xl:col-span-3 space-y-6">

              {/* Información General */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Información General" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InfoField label="Número de Inventario" icon={ClipboardDocumentListIcon}>
                    <p className="font-semibold text-slate-900">{invNumber}</p>
                  </InfoField>
                  <InfoField label="Estado" icon={StatusIcon}>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                      <div className={`w-2 h-2 rounded-full ${statusCfg.bgColor}`}></div>
                      {statusCfg.label}
                    </span>
                  </InfoField>
                  <InfoField label="Tipo de Inventario" icon={TagIcon}>
                    <p className="font-semibold text-slate-900">{TYPE_LABELS[invType] || invType}</p>
                  </InfoField>
                  <InfoField label="Descripción" icon={DocumentTextIcon}>
                    <p className="text-sm font-medium text-slate-900">{invDesc}</p>
                  </InfoField>
                </div>
              </div>

              {/* Alcance */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={MapPinIcon} title="Alcance del Inventario" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <InfoField label="Área"      icon={MapPinIcon}><p className="font-semibold text-slate-900">{safeArea || 'Todas las áreas'}</p></InfoField>
                  <InfoField label="Categoría" icon={TagIcon}><p className="font-semibold text-slate-900">{safeCat  || 'Todas las categorías'}</p></InfoField>
                  <InfoField label="Ubicación" icon={MapPinIcon}><p className="font-semibold text-slate-900">{safeLoc  || 'Todas las ubicaciones'}</p></InfoField>
                </div>
              </div>

              {/* Programación */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={CalendarIcon} title="Programación" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InfoField label="Fecha Inicio Planificada" icon={CalendarIcon}><p className="font-semibold text-slate-900">{formatDate(inventory.plannedStartDate)}</p></InfoField>
                  <InfoField label="Fecha Fin Planificada"    icon={CalendarIcon}><p className="font-semibold text-slate-900">{formatDate(inventory.plannedEndDate)}</p></InfoField>
                  {inventory.actualStartDate && <InfoField label="Fecha Inicio Real" icon={CalendarIcon}><p className="font-semibold text-slate-900">{formatDateTime(inventory.actualStartDate)}</p></InfoField>}
                  {inventory.actualEndDate   && <InfoField label="Fecha Fin Real"    icon={CalendarIcon}><p className="font-semibold text-slate-900">{formatDateTime(inventory.actualEndDate)}</p></InfoField>}
                </div>
              </div>

              {/* Responsable */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={UserIcon} title="Responsable" />
                <div className="p-6">
                  <InfoField label="Responsable General" icon={UserIcon}>
                    <p className="font-semibold text-slate-900">{safeResp || 'No asignado'}</p>
                  </InfoField>
                </div>
              </div>

              {/* Opciones */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={CheckCircleIcon} title="Opciones del Inventario" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Incluye Faltantes',    value: inventory.includesMissing },
                    { label: 'Incluye Sobrantes',    value: inventory.includesSurplus },
                    { label: 'Requiere Fotografías', value: inventory.requiresPhotos },
                  ].map(({ label, value }) => (
                    <div key={label} className={`p-4 rounded-xl border-2 flex items-center gap-3 ${value ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'}`}>
                      {value ? <CheckCircleIcon className="h-5 w-5 text-teal-600 flex-shrink-0" /> : <XCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
                      <p className={`text-sm font-semibold ${value ? 'text-teal-900' : 'text-gray-500'}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fotografías del inventario — usa variable parseada */}
              {photographs.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg"><CameraIcon className="h-5 w-5 text-white" /></div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fotografías</h4>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{photographs.length}</span>
                  </div>
                  <div className="p-4">
                    <div className={`grid gap-3 ${photographs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {photographs.map((photo, i) => {
                        const url = photo?.data || photo;
                        return (
                          <div key={i} className={`group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-teal-400 cursor-pointer bg-gray-100 ${photographs.length === 1 ? 'h-48' : 'h-28'}`} onClick={() => openPhoto(url, i)}>
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-contain bg-white" />
                            <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{i + 1}</div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2">Clic para ver en tamaño completo</p>
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              {(invObs || invTeam) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon={DocumentTextIcon} title="Información Adicional" />
                  <div className="p-6 space-y-5">
                    {[{ label: 'Observaciones', value: invObs }, { label: 'Equipo de Inventario', value: invTeam }]
                      .filter(f => f.value)
                      .map(({ label, value }) => (
                        <div key={label}>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{label}</label>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[72px]">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{value}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* ── Bienes Verificados — solo cuando COMPLETADO ── */}
              {normalizedStatus === 'COMPLETED' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-teal-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl"><ClipboardDocumentListIcon className="h-5 w-5 text-white" /></div>
                      <h4 className="text-base font-bold text-white uppercase tracking-wider">Bienes Verificados</h4>
                    </div>
                    {!loadingDetails && (
                      <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{details.length} registros</span>
                    )}
                  </div>

                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                      <span className="ml-3 text-gray-500 text-sm">Cargando bienes...</span>
                    </div>
                  ) : details.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">No hay bienes verificados registrados</div>
                  ) : (
                    <>
                      {/* Resumen */}
                      <div className="grid grid-cols-5 gap-3 p-4 border-b border-gray-100">
                        {[
                          { label: 'Total',       count: details.length,                                          color: 'bg-teal-50 text-teal-700' },
                          { label: 'Encontrados', count: details.filter(d => d.foundStatus === 'FOUND').length,   color: 'bg-green-50 text-green-700' },
                          { label: 'Faltantes',   count: details.filter(d => d.foundStatus === 'MISSING').length, color: 'bg-red-50 text-red-700' },
                          { label: 'Sobrantes',   count: details.filter(d => d.foundStatus === 'SURPLUS').length, color: 'bg-yellow-50 text-yellow-700' },
                          { label: 'Dañados',     count: details.filter(d => d.foundStatus === 'DAMAGED').length, color: 'bg-orange-50 text-orange-700' },
                        ].map(({ label, count, color }) => (
                          <div key={label} className={`${color} rounded-xl p-3 text-center`}>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tabla */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-teal-600">
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Código</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Conservación</th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Observaciones</th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1"><CameraIcon className="h-4 w-4 text-white/80" />Foto</div>
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Ver</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {details.map((detail, index) => {
                              const asset      = assets.find(a => a.id === detail.assetId);
                              const code       = asset?.assetCode || asset?.codigoPatrimonial || (detail.assetId ? detail.assetId.slice(-8) : '—');
                              const desc       = asset?.description || asset?.descripcion || '—';
                              const photos     = parseArray(detail.photographs);
                              const firstPhoto = photos.length > 0 ? (photos[0]?.data || photos[0]) : null;
                              return (
                                <tr key={detail.id || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-teal-50 transition-colors`}>
                                  {/* Estado */}
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${FOUND_BADGE[detail.foundStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                      {FOUND_LABEL[detail.foundStatus] || detail.foundStatus || '—'}
                                    </span>
                                  </td>
                                  {/* Código */}
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{code}</td>
                                  {/* Descripción */}
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate" title={desc}>{desc}</td>
                                  {/* Conservación */}
                                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{detail.actualConservationStatus || '—'}</td>
                                  {/* Observaciones */}
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate" title={detail.observations || ''}>{detail.observations || '—'}</td>
                                  {/* Foto thumbnail */}
                                  <td className="px-4 py-3 text-center">
                                    {firstPhoto ? (
                                      <img
                                        src={firstPhoto}
                                        alt="foto"
                                        className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform mx-auto"
                                        onClick={() => openPhoto(firstPhoto, 0)}
                                        title={`${photos.length} foto(s)`}
                                      />
                                    ) : (
                                      <span className="text-gray-300 text-xs">—</span>
                                    )}
                                  </td>
                                  {/* Ojito */}
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => setViewingDetail(detail)}
                                      className="inline-flex items-center justify-center p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded-lg transition-colors"
                                      title="Ver detalle completo"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Auditoría" />
                <div className="p-5 space-y-4">
                  <InfoField label="Fecha de Creación"      icon={ClockIcon}><p className="text-sm font-semibold text-slate-900">{formatDateTime(inventory.createdAt)}</p></InfoField>
                  <InfoField label="Última Actualización"   icon={ArrowPathIcon}><p className="text-sm font-semibold text-slate-900">{formatDateTime(inventory.updatedAt)}</p></InfoField>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* Modal de detalle completo del bien */}
    {viewingDetail && (
      <InventoryDetailViewModal
        isOpen={!!viewingDetail}
        onClose={() => setViewingDetail(null)}
        detail={viewingDetail}
        assets={assets}
        locations={locations}
        users={users}
        systemUsers={systemUsers}
      />
    )}
    </>
  );
}
