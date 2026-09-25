import React, { useState, useEffect, useRef } from 'react';
import { getBienPatrimonialById } from '../../services/api';
import useConfigurationData from '../../hooks/useConfigurationData';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Modal para mostrar los detalles completos de un bien patrimonial
 */

const ASSET_STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  IN_USE: 'En Uso',
  MAINTENANCE: 'Mantenimiento',
  INACTIVE: 'Baja',
  LOANED: 'Prestado',
  DISPONIBLE: 'Disponible',
  EN_USO: 'En Uso',
  MANTENIMIENTO: 'Mantenimiento',
  BAJA: 'Baja',
  PRESTADO: 'Prestado',
};

const CONSERVATION_STATUS_LABELS = {
  NUEVO: 'Nuevo',
  NEW: 'Nuevo',
  BUENO: 'Bueno',
  GOOD: 'Bueno',
  REGULAR: 'Regular',
  MALO: 'Malo',
  BAD: 'Malo',
  EXCELLENT: 'Excelente',
  UNUSABLE: 'Inutilizable',
  OBSOLETE: 'Obsoleto',
};

const getStatusLabel = (value, mapping) => {
  if (!value) return '-';
  const normalized = value.toUpperCase();
  return mapping[normalized] || mapping[value] || value;
};

const USAGE_CONDITION_LABELS = {
  EXCELENTE: 'Excelente',
  BUENO: 'Bueno',
  REGULAR: 'Regular',
  DEFICIENTE: 'Deficiente',
  EXCELLENT: 'Excelente',
  GOOD: 'Bueno',
  BAD: 'Malo',
  DEFICIENT: 'Deficiente',
};

const getStatusColor = (value) => {
  const v = value?.toUpperCase();
  if (v === 'DISPONIBLE' || v === 'AVAILABLE') return 'bg-green-100 text-green-800';
  if (v === 'EN_USO' || v === 'IN_USE') return 'bg-blue-100 text-blue-800';
  if (v === 'MANTENIMIENTO' || v === 'MAINTENANCE') return 'bg-yellow-100 text-yellow-800';
  if (v === 'BAJA' || v === 'INACTIVE') return 'bg-red-100 text-red-800';
  if (v === 'PRESTADO' || v === 'LOANED') return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
};

export default function AssetDetailModal({ isOpen, onClose, bien: propBien, onEdit }) {
  const [fullBien, setFullBien] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (isOpen && propBien?.id) {
      setLoadingDetail(true);
      getBienPatrimonialById(propBien.id)
        .then(data => {
          console.log('📦 AssetDetailModal - getBienPatrimonialById response:', data);
          setFullBien(data);
        })
        .catch(err => {
          console.error('❌ AssetDetailModal - error fetching detail:', err);
          setFullBien(null);
        })
        .finally(() => setLoadingDetail(false));
    } else {
      setFullBien(null);
    }
  }, [isOpen, propBien?.id]);

  const bien = fullBien || propBien;

  // Generar texto del QR con información del bien
  const getQRValue = () => {
    if (!bien) return '';
    const codigo = bien.qrCode || bien.codigoQr || bien.assetCode || bien.codigoPatrimonial || '-';
    const descripcion = bien.description || bien.descripcion || '-';
    const marca = bien.brand || bien.marca || '-';
    const modelo = bien.model || bien.modelo || '-';
    const estado = getStatusLabel(bien.assetStatus || bien.estadoBien, ASSET_STATUS_LABELS);
    const ubicacion = bien.ubicacionActual || bien.location?.name || '-';
    const categoria = bien.category?.name || bien.categoria || '-';

    return `BIEN PATRIMONIAL
━━━━━━━━━━━━━━━━
Código: ${codigo}
Descripción: ${descripcion}
Marca: ${marca}
Modelo: ${modelo}
Estado: ${estado}
Ubicación: ${ubicacion}
Categoría: ${categoria}`;
  };

  // Use the configuration hook (same as AssetModal) to resolve IDs to labels
  const configData = useConfigurationData();
  const { areas, categories, locations: ubicaciones, responsible: responsables, suppliers: providers } = configData;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: bien?.currency || bien?.moneda || 'PEN',
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const InfoRow = ({ label, value, fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-2' : ''}`}>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 font-semibold">{value || '-'}</dd>
    </div>
  );

  // Resolve an id (UUID string) against a list [{id, label, ...}]
  const resolveLabel = (id, list = []) => {
    if (!id || !list?.length) return null;
    const key = String(id);
    const found = list.find(item => {
      const itemId = String(item?.id ?? item?.value ?? '');
      return itemId === key;
    });
    return found?.label ?? found?.nombre ?? found?.name ?? found?.razonSocial ?? null;
  };

  // Cargar datos de configuración cuando el modal abre
  useEffect(() => {
    if (isOpen) {
      configData.reload();
    }
  }, [isOpen]);

  if (!isOpen || !bien) return null;

  // Resolved labels using the hook data
  const locationLabel =
    resolveLabel(bien.currentLocationId, ubicaciones) ||
    resolveLabel(bien.ubicacionActual, ubicaciones) || null;

  const responsibleLabel =
    resolveLabel(bien.currentResponsibleId, responsables) ||
    resolveLabel(bien.responsableActual, responsables) || null;

  const areaLabel =
    resolveLabel(bien.currentAreaId, areas) ||
    resolveLabel(bien.areaAsignada, areas) || null;

  const categoryLabel =
    resolveLabel(bien.categoryId, categories) ||
    resolveLabel(bien.categoriaId, categories) || null;

  const finalUserLabel =
    resolveLabel(bien.finalUserId, responsables) || null;

  const supplierLabel =
    resolveLabel(bien.supplierId, providers) ||
    resolveLabel(bien.proveedorId, providers) || null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Detalle del Bien Patrimonial
                </h3>
                <p className="text-slate-300 text-sm">
                  Código: {bien.assetCode || bien.codigoPatrimonial}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* Información Principal */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <h4 className="text-xl font-bold text-slate-800 mb-4">
                {bien.description || bien.descripcion}
              </h4>
              {(bien.details || bien.detalles) && (
                <p className="text-slate-600 text-sm">{bien.details || bien.detalles}</p>
              )}
              <div className="mt-4 flex gap-3 flex-wrap">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(bien.assetStatus || bien.estadoBien)}`}>
                  {getStatusLabel(bien.assetStatus || bien.estadoBien, ASSET_STATUS_LABELS)}
                </span>
                {(bien.conservationStatus || bien.estadoFisico) && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                    {getStatusLabel(bien.conservationStatus || bien.estadoFisico, CONSERVATION_STATUS_LABELS)}
                  </span>
                )}
              </div>
            </div>

            {/* Características Técnicas */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Características Técnicas
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Marca" value={bien.brand || bien.marca} />
                <InfoRow label="Modelo" value={bien.model || bien.modelo} />
                <InfoRow label="Serie" value={bien.serialNumber || bien.serie} />
                <InfoRow label="Color" value={bien.color} />
                <InfoRow label="Dimensiones" value={bien.dimensions || bien.dimensiones} fullWidth />
                <InfoRow label="Peso" value={(bien.weight || bien.peso) ? `${bien.weight || bien.peso} kg` : '-'} />
              </dl>
            </div>

            {/* Información Financiera */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información Financiera
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Fecha de Adquisición" value={formatDate(bien.acquisitionDate || bien.fechaAdquisicion)} />
                <InfoRow label="Valor de Adquisición" value={formatCurrency(bien.acquisitionValue || bien.valorAdquisicion)} />
                <InfoRow label="Valor Actual" value={formatCurrency(bien.currentValue || bien.valorActual)} />
                <InfoRow label="Valor Residual" value={formatCurrency(bien.residualValue || bien.valorResidual)} />
                <InfoRow label="Vida Útil" value={(bien.usefulLife || bien.vidaUtil) ? `${bien.usefulLife || bien.vidaUtil} meses` : '-'} />
                <InfoRow label="Método Depreciación" value={bien.metodoDepreciacion} />
                <InfoRow label="Depreciable" value={(bien.isDepreciable ?? bien.esDepreciable) ? 'Sí' : 'No'} />
                <InfoRow label="Moneda" value={bien.currency || bien.moneda} />
              </dl>
            </div>

            {/* Ubicación y Responsabilidad */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ubicación y Responsabilidad
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Ubicación Actual" value={locationLabel || String(bien.ubicacionActual || bien.ubicacion || '-')} />
                <InfoRow label="Ubicación Física" value={bien.ubicacionFisica} />
                <InfoRow label="Responsable" value={responsibleLabel || String(bien.responsableActual || bien.responsable || '-')} />
                <InfoRow label="Área Asignada" value={areaLabel || String(bien.areaAsignada || bien.area || '-')} />
                <InfoRow label="Proveedor" value={supplierLabel || String(bien.proveedorId || '-')} />
                <InfoRow label="Condición de Uso" value={getStatusLabel(bien.condicionUso, USAGE_CONDITION_LABELS)} fullWidth />
              </dl>
            </div>

            {/* Documentación */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documentación
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 mb-4">
                <InfoRow label="N° Factura" value={bien.invoiceNumber || bien.facturaNumero || bien.numeroFactura} />
                <InfoRow label="Orden de Compra" value={bien.purchaseOrderNumber || bien.ordenCompra || bien.numeroOrdenCompra} />
                <InfoRow label="Vencimiento Garantía" value={formatDate(bien.warrantyExpirationDate || bien.fechaVencimientoGarantia)} />
              </dl>

              {/* Archivos Adjuntos */}
              {bien.attachedDocuments && (() => {
                try {
                  const docs = typeof bien.attachedDocuments === 'string' 
                    ? JSON.parse(bien.attachedDocuments) 
                    : bien.attachedDocuments;
                  
                  if (Array.isArray(docs) && docs.length > 0) {
                    return (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                          Archivos Adjuntos ({docs.length}):
                        </p>
                        <div className="space-y-2">
                          {docs.map((doc, index) => (
                            <a
                              key={index}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition group"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {doc.fileType?.includes('pdf') ? (
                                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                ) : doc.fileType?.includes('image') ? (
                                  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">
                                    {doc.fileName}
                                  </p>
                                  {doc.fileSize && (
                                    <p className="text-xs text-slate-500">
                                      {(doc.fileSize / 1024).toFixed(2)} KB
                                    </p>
                                  )}
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing attachedDocuments:', e);
                }
                return null;
              })()}
            </div>

            {/* Identificadores */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Identificadores
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Código QR" value={bien.qrCode || bien.codigoQr || bien.assetCode || bien.codigoPatrimonial} />
                <InfoRow label="Código de Barras" value={bien.barcode || bien.codigoBarras} />
                <InfoRow label="Etiqueta RFID" value={bien.rfidTag || bien.etiquetaRfid} />
              </dl>
              {/* QR Visual */}
              {(bien.qrCode || bien.assetCode || bien.codigoPatrimonial) && (
                <div id="asset-qr-print" className="mt-4 flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg">
                  <p className="text-sm font-medium text-slate-600">Código QR del Bien</p>
                  <QRCodeSVG
                    value={getQRValue()}
                    size={160}
                    level="M"
                    includeMargin
                  />
                  <p className="text-xs text-slate-400">{bien.qrCode || bien.assetCode || bien.codigoPatrimonial}</p>
                  <button
                    onClick={() => {
                      const container = document.getElementById('asset-qr-print');
                      const svg = container?.querySelector('svg');
                      if (!svg) return;
                      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `QR_${bien.assetCode || bien.codigoPatrimonial || 'bien'}.svg`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                  >
                    Descargar QR
                  </button>
                </div>
              )}
            </div>

            {/* Mantenimiento */}
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Información de Mantenimiento
              </h5>
              <dl className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                <InfoRow label="Requiere Mantenimiento" value={(bien.requiresMaintenance ?? bien.requiereMantenimiento) ? 'Sí' : 'No'} />
              </dl>
            </div>

            {/* Observaciones */}
            {(bien.observations || bien.observaciones) && (
              <div className="mb-4">
                <h5 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Observaciones
                </h5>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 text-sm">{bien.observations || bien.observaciones}</p>
                </div>
              </div>
            )}

            {/* Metadatos */}
            <div className="border-t pt-4">
              <dl className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                <InfoRow label="Fecha de Ingreso" value={formatDate(bien.entryDate || bien.fechaIngreso)} />
                <InfoRow label="Creado el" value={formatDate(bien.createdAt)} />
                <InfoRow label="Última actualización" value={formatDate(bien.updatedAt)} />
                <InfoRow label="Versión" value={bien.version} />
              </dl>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-between border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              Cerrar
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(bien);
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
