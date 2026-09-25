import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CameraIcon,
  TagIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import InventoryDetailReport from '../reports/InventoryDetailReport';

// Constants
const FOUND_STATUS_CONFIG = {
  FOUND: {
    label: 'Encontrado',
    color: 'bg-green-50 text-green-700 border-green-200',
    bgColor: 'bg-green-500',
    icon: CheckCircleIcon,
  },
  MISSING: {
    label: 'Faltante',
    color: 'bg-red-50 text-red-700 border-red-200',
    bgColor: 'bg-red-500',
    icon: XCircleIcon,
  },
  SURPLUS: {
    label: 'Sobrante',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-500',
    icon: PlusIcon,
  },
  DAMAGED: {
    label: 'Dañado',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    bgColor: 'bg-amber-500',
    icon: ExclamationTriangleIcon,
  },
};

const CONSERVATION_LABELS = {
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  BAD: 'Malo',
  UNUSABLE: 'Inutilizable',
};

// Utilities
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES');
  } catch {
    return 'N/A';
  }
};

const getLocationName = (id, locations = []) => {
  if (!id) return 'No especificada';
  const location = locations.find(l => l.id === id);
  return location ? location.name : 'No especificada';
};

const getUserName = (id, users = [], systemUsers = []) => {
  if (!id) return 'No asignado';

  // 1. Buscar directamente en personas (por si el ID es un personId)
  const person = users.find(u => u.id === id);
  if (person) {
    const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
    if (fullName) return fullName;
    return person.fullName || person.nombre || person.personalEmail || null;
  }

  // 2. Buscar en usuarios del sistema y resolver via personId
  const sysUser = systemUsers.find(u => u.id === id);
  if (sysUser) {
    // Intentar resolver nombre desde la persona vinculada
    if (sysUser.personId) {
      const linkedPerson = users.find(p => p.id === sysUser.personId);
      if (linkedPerson) {
        const fullName = `${linkedPerson.firstName || ''} ${linkedPerson.lastName || ''}`.trim();
        if (fullName) return fullName;
      }
    }
    // Fallback: username del sistema
    return sysUser.username || sysUser.name || sysUser.email || 'No asignado';
  }

  return 'No asignado';
};

const getAssetInfo = (assetId, assets = []) => {
  const asset = assets.find(a => a.id === assetId);
  const code = asset?.assetCode || asset?.codigoPatrimonial || (assetId ? assetId.slice(-8) : 'Sin asignar');
  const description = asset?.description || asset?.descripcion || 'Sin descripción';
  return { code, description };
};

const openPhotoInNewWindow = (photoUrl, index) => {
  if (photoUrl) {
    const img = new Image();
    img.onload = () => {
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Fotografía ${index + 1}</title>
            <style>
              body { margin: 0; padding: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${photoUrl}" alt="Fotografía ${index + 1}" />
          </body>
        </html>
      `);
      newWindow.document.close();
    };
    img.onerror = () => {
      alert('No se pudo cargar la imagen');
    };
    img.src = photoUrl;
  }
};

// Components
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="bg-teal-600 px-6 py-4 flex items-center gap-3 rounded-t-2xl">
    <div className="bg-white/20 p-2 rounded-lg">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h4>
  </div>
);

const InfoBox = ({ label, value, icon: Icon }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200">
      <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

const PhotoGrid = ({ photographs }) => (
  <div className="space-y-3">
    <div className={`grid gap-3 ${photographs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {photographs.map((photo, index) => {
        const photoUrl = photo.data || photo;
        return (
          <div
            key={index}
            className={`group relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-teal-400 cursor-pointer bg-gray-100 ${
              photographs.length === 1 ? 'h-48' : 'h-28'
            }`}
            onClick={() => openPhotoInNewWindow(photoUrl, index)}
          >
            <img
              src={photoUrl}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-contain bg-white group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-teal-500 rounded-full p-3 shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {index + 1}
            </div>
          </div>
        );
      })}
    </div>
    <p className="text-xs text-center text-gray-400">Clic para ver en tamaño completo</p>
  </div>
);

// Main Component
export default function InventoryDetailViewModal({
  isOpen,
  onClose,
  detail,
  inventory,
  locations = [],
  users = [],
  systemUsers = [],
  assets = [],
  municipalityName = 'Municipalidad',
}) {
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  if (!isOpen || !detail) return null;

  // Data preparation
  const statusConfig = FOUND_STATUS_CONFIG[detail.foundStatus] || FOUND_STATUS_CONFIG.FOUND;
  const StatusIcon = statusConfig.icon;

  const locationName = getLocationName(detail.actualLocationId, locations);
  const responsibleName = getUserName(detail.actualResponsibleId, users, systemUsers);
  const verificationDate = formatDate(detail.verificationDate);
  const verifiedByName = getUserName(detail.verifiedBy, users, systemUsers);
  const { code: assetCode, description: assetDesc } = getAssetInfo(detail.assetId, assets);
  const conservationStatus =
    CONSERVATION_LABELS[detail.actualConservationStatus] ||
    detail.actualConservationStatus ||
    'No especificado';

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const element = (
        <InventoryDetailReport 
          inventory={inventory} 
          municipalityName={municipalityName} 
          extraNames={{
            locationName: locationName,
            responsibleName: responsibleName,
            detailLocationName: locationName,
            detailResponsibleName: responsibleName,
          }} 
          details={[{ ...detail, _displayLocationName: locationName, _displayResponsibleName: responsibleName }]} 
          assets={assets}
          locations={locations}
          users={users}
        />
      );
      
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventario_detalle_${detail.id?.slice(-8) || 'reporte'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-teal-600 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <StatusIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Detalle de Verificación</h3>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                  <div className={`w-2 h-2 rounded-full ${statusConfig.bgColor}`}></div>
                  {statusConfig.label}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descargar PDF"
              >
                <DocumentArrowDownIcon className="h-6 w-6" />
              </button>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all hover:rotate-90"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Asset Information */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Información del Bien" />
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoBox label="Código" icon={TagIcon} value={assetCode} />
                    <InfoBox label="Estado de Conservación" icon={ShieldCheckIcon} value={conservationStatus} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Descripción</label>
                    <div className="bg-white rounded-lg px-4 py-3 border border-gray-200 min-h-[48px] flex items-center">
                      <p className="text-sm text-slate-700">{assetDesc}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location and Responsible */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={MapPinIcon} title="Ubicación y Responsable" />
                <div className="p-6 grid grid-cols-2 gap-4">
                  <InfoBox label="Ubicación Actual" icon={MapPinIcon} value={locationName} />
                  <InfoBox label="Responsable Actual" icon={UserIcon} value={responsibleName} />
                </div>
              </div>

              {/* Photographs */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CameraIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fotografías</h4>
                  </div>
                  {detail.photographs?.length > 0 && (
                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {detail.photographs.length}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {detail.photographs?.length > 0 ? (
                    <PhotoGrid photographs={detail.photographs} />
                  ) : (
                    <div className="text-center py-6">
                      <div className="bg-gray-50 rounded-full p-3 w-14 h-14 mx-auto mb-2 flex items-center justify-center border-2 border-dashed border-gray-200">
                        <CameraIcon className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">Sin fotografías</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observations */}
              {(detail.observations || detail.physicalDifferences || detail.documentDifferences) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon={DocumentTextIcon} title="Observaciones" />
                  <div className="p-6 space-y-4">
                    {detail.observations && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Observaciones Generales</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[60px]">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.observations}</p>
                        </div>
                      </div>
                    )}
                    {detail.physicalDifferences && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Diferencias Físicas</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[60px]">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.physicalDifferences}</p>
                        </div>
                      </div>
                    )}
                    {detail.documentDifferences && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Diferencias Documentales</label>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 min-h-[60px]">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{detail.documentDifferences}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Corrective Action */}
              {detail.requiresAction && (
                <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                  <div className="bg-red-500 px-6 py-4 flex items-center gap-3 rounded-t-2xl">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Acción Correctiva Requerida
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-900 whitespace-pre-wrap">
                        {detail.requiredAction || 'No especificada'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={CalendarIcon} title="Verificación" />
                <div className="p-6 space-y-4">
                  <InfoBox label="Fecha de Verificación" icon={CalendarIcon} value={verificationDate} />
                  <InfoBox label="Verificado por" icon={UserIcon} value={verifiedByName} />
                </div>
              </div>

              {/* Audit */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Auditoría" />
                <div className="p-6 space-y-4">
                  <InfoBox label="Creado" icon={ClockIcon} value={formatDate(detail.createdAt)} />
                  <InfoBox label="Actualizado" icon={ArrowPathIcon} value={formatDate(detail.updatedAt)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

