import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getAllDisposals,
  getDisposalsByStatus,
  getDisposalDetailsByDisposalId,
  finalizeDisposal,
  cancelDisposal,
  restoreDisposal,
  DISPOSAL_STATUS,
  DISPOSAL_TYPES,
} from '../../services/disposalService';

import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import ReportDocument from '../../components/PatrimonioReports';
import DisposalSBNReport from '../../components/disposals/DisposalSBNReport';
import CreateDisposalModal from '../../components/disposals/CreateDisposalModal';
import AddAssetsToDisposalModal from '../../components/disposals/AddAssetsToDisposalModal';
import StartEvaluationModal from '../../components/disposals/StartEvaluationModal';
import { formatDateOnly, getDateValue } from '../../utils/dateUtils';
import TechnicalOpinionModal from '../../components/disposals/TechnicalOpinionModal';
import ResolveDisposalModal from '../../components/disposals/ResolveDisposalModal';
import ViewDisposalAssetsModal from '../../components/disposals/ViewDisposalAssetsModal';
import { useAuth } from '../../../ms-02-authentication/hooks/useAuth';
import { usePermissions } from '../../../../hooks/usePermissions';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
import ContentLoading from '../../../../shared/utils/ContentLoading.jsx';

/**
 * Genera QR codes para una lista de bienes en un expediente de baja
 * @param {Array} assets - Lista de bienes
 * @param {Object} disposal - Expediente de baja
 * @returns {Promise<Array>} - Bienes con QR generado
 */
const generateQRsForAssets = async (assets, disposal) => {
  return Promise.all(
    (assets || []).map(async (asset) => {
      try {
        const qrValue = asset.assetCode || asset.codigoPatrimonial || '';
        const assetName = asset.assetDescription || asset.nombre || asset.name || asset.assetName || asset.descripcion || asset.description || '-';

        // Crear información legible del bien para el QR
        const qrText = [
          'BIEN PATRIMONIAL - BAJA',
          '\u2501'.repeat(22),
          `Código: ${qrValue}`,
          `Nombre del Bien: ${assetName}`,
          `Expediente: ${disposal.fileNumber || '-'}`,
          `Motivo: ${disposal.disposalReason || disposal.name || '-'}`,
        ].join('\n');

        // Generar QR como data URL PNG
        const qrDataUrl = await QRCode.toDataURL(qrText, {
          width: 120,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });

        return {
          ...asset,
          qrDataUrl: qrDataUrl,
          qrCode: qrValue
        };
      } catch (error) {
        console.error('Error generando QR para bien:', asset.assetCode || asset.id, error);
        return {
          ...asset,
          qrDataUrl: null,
          qrCode: asset.assetCode || asset.codigoPatrimonial || ''
        };
      }
    })
  );
};

/**
 * Página de gestión de expedientes de baja
 * 
 * FLUJO SIMPLIFICADO:
 * 1. Crear Expediente (con technicalReportAuthorId)
 * 2. Agregar Bienes
 * 3. Iniciar Evaluación (solo confirma - sin comité)
 * 4. [Opcional] Agregar Opinión Técnica
 * 5. Aprobar/Rechazar (Admin. Finanzas)
 * 6. Finalizar Baja Física
 */

/**crea una funcion para poder tener mejor el diseño del reporte de bajas */





export default function DisposalManagementPage() {
  const { user } = useAuth();
  const { canDo } = usePermissions();
  const [disposals, setDisposals] = useState([]);
  const [filteredDisposals, setFilteredDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('INITIATED');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('fileNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddAssetsModal, setShowAddAssetsModal] = useState(false);
  const [showStartEvaluationModal, setShowStartEvaluationModal] = useState(false);
  const [showTechnicalOpinionModal, setShowTechnicalOpinionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  // Map de disposalId → número de bienes (para INITIATED)
  const [disposalAssetCounts, setDisposalAssetCounts] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportingDisposalId, setExportingDisposalId] = useState(null);

  useEffect(() => {
    loadDisposals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [disposals, statusFilter, typeFilter, searchTerm, sortField, sortDirection]);

  const loadDisposals = async () => {
    try {
      setLoading(true);
      const municipalityId = getMunicipalityId();
      const data = await getAllDisposals();
      
      // Filtrar por municipalityId (client-side)
      const filteredData = data.filter(d => !municipalityId || d.municipalityId === municipalityId);
      setDisposals(filteredData);
      
      // Cargar conteo de bienes para expedientes INITIATED
      const initiated = filteredData.filter(d => d.fileStatus === 'INITIATED');
      const counts = {};
      await Promise.all(
        initiated.map(async (d) => {
          try {
            const details = await getDisposalDetailsByDisposalId(d.id);
            counts[d.id] = details?.length || 0;
          } catch {
            counts[d.id] = 0;
          }
        })
      );
      setDisposalAssetCounts(counts);
    } catch (err) {
      setError('Error al cargar los expedientes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...disposals];

    // Filter by status
    filtered = filtered.filter(d => d.fileStatus === statusFilter);

    // Filter by type
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(d => d.disposalType === typeFilter);
    }

    // Filter by search term - búsqueda global en todos los campos
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d => {
        const fileNumber = d.fileNumber?.toLowerCase() || '';
        const reason = d.disposalReason?.toLowerCase() || '';
        const status = getStatusBadge(d.fileStatus).props.children?.toLowerCase() || '';
        const type = getTypeBadge(d.disposalType).props.children?.toLowerCase() || '';
        const date = formatDateOnly(d.createdAt);

        return fileNumber.includes(search) ||
          reason.includes(search) ||
          status.includes(search) ||
          type.includes(search) ||
          date.includes(search);
      });
    }

    // Ordenar por campo seleccionado
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'fileNumber':
          aValue = a.fileNumber || '';
          bValue = b.fileNumber || '';
          break;
        case 'disposalType':
          aValue = a.disposalType || '';
          bValue = b.disposalType || '';
          break;
        case 'fileStatus':
          aValue = a.fileStatus || '';
          bValue = b.fileStatus || '';
          break;
        case 'createdAt':
          aValue = getDateValue(a.createdAt);
          bValue = getDateValue(b.createdAt);
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDisposals(filtered);
  };

  const handleCreateDisposal = () => {
    setShowCreateModal(true);
  };

  const handleEditDisposal = (disposal) => {
    setSelectedDisposal(disposal);
    setShowEditModal(true);
  };

  const handleAddAssets = (disposal) => {
    setSelectedDisposal(disposal);
    setShowAddAssetsModal(true);
  };

  const handleStartEvaluation = async (disposal) => {
    try {
      const details = await getDisposalDetailsByDisposalId(disposal.id);
      if (!details || details.length === 0) {
        Swal.fire({
          title: 'Sin bienes registrados',
          html: `<p class="text-slate-600">El expediente <strong>${disposal.fileNumber}</strong> no tiene bienes agregados.<br/>Primero agrega los bienes antes de iniciar la evaluación.</p>`,
          icon: 'warning',
          confirmButtonColor: '#475569',
          confirmButtonText: 'Entendido',
          customClass: { popup: 'rounded-2xl shadow-2xl' },
        });
        return;
      }
    } catch {
      // Si falla la consulta, permitimos continuar
    }
    setSelectedDisposal(disposal);
    setShowStartEvaluationModal(true);
  };

  const handleAddOpinion = (disposal) => {
    setSelectedDisposal(disposal);
    setShowTechnicalOpinionModal(true);
  };

  const handleResolve = (disposal) => {
    setSelectedDisposal(disposal);
    setShowResolveModal(true);
  };

  const handleFinalize = async (disposal) => {
    const result = await Swal.fire({
      title: '¿Finalizar expediente?',
      html: `<p class="text-slate-600">El expediente <strong>${disposal.fileNumber}</strong> será marcado como <strong>EJECUTADO</strong> y los bienes pasarán a estado BAJA.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🏁 Sí, finalizar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Finalizando...',
      html: '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mb-4"></div><p class="text-slate-600">Por favor espera un momento</p></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    try {
      await finalizeDisposal(disposal.id);
      await Swal.fire({
        title: '¡Expediente finalizado!',
        html: '<div class="text-center"><div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg></div><p class="text-slate-600">Los bienes han sido dados de baja correctamente.</p></div>',
        icon: null,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl shadow-2xl border border-slate-100' },
      });
      loadDisposals();
    } catch (err) {
      Swal.fire({
        title: 'Error al finalizar',
        html: `<p class="text-slate-600">${err.message || 'No se pudo finalizar el expediente'}</p>`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Cerrar',
        customClass: { popup: 'rounded-2xl shadow-2xl' },
      });
    }
  };

  const handleCancel = async (disposal) => {
    const result = await Swal.fire({
      title: '¿Cancelar expediente?',
      html: `<p class="text-slate-600">El expediente <strong>${disposal.fileNumber}</strong> cambiará de estado a <strong>CANCELADO</strong>. Esta acción no se puede deshacer.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🚫 Sí, cancelar',
      cancelButtonText: 'Volver',
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    if (!result.isConfirmed) return;

    const validCancelledBy = user?.userId;

    Swal.fire({
      title: 'Cancelando...',
      html: '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mb-4"></div><p class="text-slate-600">Por favor espera un momento</p></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    try {
      await cancelDisposal(disposal.id, validCancelledBy);
      await Swal.fire({
        title: '¡Expediente cancelado!',
        html: '<div class="text-center"><div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></div><p class="text-slate-600">El expediente ha sido cancelado.</p></div>',
        icon: null,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl shadow-2xl border border-slate-100' },
      });
      loadDisposals();
    } catch (err) {
      Swal.fire({
        title: 'Error al cancelar',
        html: `<p class="text-slate-600">${err.message || 'No se pudo cancelar el expediente'}</p>`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Cerrar',
        customClass: { popup: 'rounded-2xl shadow-2xl' },
      });
    }
  };

  const handleRestore = async (disposal) => {
    const result = await Swal.fire({
      title: '¿Restaurar expediente?',
      html: `<p class="text-slate-600">El expediente <strong>${disposal.fileNumber}</strong> volverá a estado <strong>RESTAURADO</strong> y los bienes pasarán a <strong>AVAILABLE</strong>.</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: '🔄 Sí, restaurar',
      cancelButtonText: 'Volver',
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'Restaurando...',
      html: '<div class="text-center py-4"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mb-4"></div><p class="text-slate-600">Por favor espera un momento</p></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: { popup: 'rounded-2xl shadow-2xl' },
    });

    try {
      await restoreDisposal(disposal.id);
      await Swal.fire({
        title: '¡Expediente restaurado!',
        html: '<div class="text-center"><div class="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div><p class="text-slate-600">Los bienes han sido restaurados a estado AVAILABLE.</p></div>',
        icon: null,
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl shadow-2xl border border-slate-100' },
      });
      loadDisposals();
    } catch (err) {
      Swal.fire({
        title: 'Error al restaurar',
        html: `<p class="text-slate-600">${err.message || 'No se pudo restaurar el expediente'}</p>`,
        icon: 'error',
        confirmButtonColor: '#0d9488',
        confirmButtonText: 'Cerrar',
        customClass: { popup: 'rounded-2xl shadow-2xl' },
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      INITIATED: { label: 'Iniciado', color: 'bg-blue-100 text-blue-800' },
      UNDER_EVALUATION: { label: 'En Evaluación', color: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
      EXECUTED: { label: 'Ejecutado', color: 'bg-purple-100 text-purple-800' },
      CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
      RESTORED: { label: 'Restaurado', color: 'bg-teal-100 text-teal-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      OBSOLESCENCE: { label: 'Obsolescencia', icon: '📦' },
      DETERIORATION: { label: 'Deterioro', icon: '🔧' },
      LOSS: { label: 'Pérdida', icon: '❌' },
      THEFT: { label: 'Robo', icon: '🚨' },
      OTHER: { label: 'Otro', icon: '📝' },
    };

    const config = typeConfig[type] || { label: type, icon: '📄' };

    return (
      <span className="text-sm text-slate-600">
        {config.icon} {config.label}
      </span>
    );
  };

  const getRelevantDate = (disposal) => {
    // Retornar la fecha más relevante según el estado
    switch (disposal.fileStatus) {
      case 'INITIATED':
        return { date: disposal.createdAt, label: 'Creado' };
      case 'UNDER_EVALUATION':
        return { date: disposal.technicalEvaluationDate, label: 'En Evaluación' };
      case 'APPROVED':
        return { date: disposal.approvalDate, label: 'Aprobado' };
      case 'REJECTED':
        return { date: disposal.approvalDate, label: 'Rechazado' };
      case 'EXECUTED':
        return { date: disposal.physicalRemovalDate, label: 'Ejecutado' };
      case 'CANCELLED':
        return { date: disposal.updatedAt, label: 'Cancelado' };
      default:
        return { date: disposal.createdAt, label: 'Creado' };
    }
  };

  const getActionButtons = (disposal) => {
    const actions = [];

    switch (disposal.fileStatus) {
      case 'INITIATED':
        actions.push(

          <button
            key="generate-pdf"
            onClick={async () => {
              setExportingDisposalId(disposal.id);
              try {
                let details = [];
                try {
                  details = await getDisposalDetailsByDisposalId(disposal.id);
                } catch (e) {
                  details = [];
                }
                const assetsWithQR = await generateQRsForAssets(details, disposal);
                try {
                  const blob = await pdf(<ReportDocument type="bajas" items={[{ ...disposal, assets: assetsWithQR }]} meta={{ title: `Expediente ${disposal.fileNumber || ''}`, isIndividual: true }} />).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `expediente_${disposal.fileNumber || 'expediente'}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Error generating disposal PDF via react-pdf, falling back:', err);
                  generateDisposalPDF && generateDisposalPDF(disposal, details);
                }
              } catch (err) {
                console.error('Error generating disposal PDF:', err);
              } finally {
                setExportingDisposalId(null);
              }
            }}
            disabled={exportingDisposalId !== null}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-1.5 ${
              exportingDisposalId === disposal.id 
                ? 'bg-green-400 cursor-wait' 
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            } text-white`}
            title="Generar PDF del expediente"
          >
            {exportingDisposalId === disposal.id ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </>
            )}
          </button>
        );
        if (canDo('patrimonio', 'update')) actions.push(
          <button
            key="edit-disposal"
            onClick={() => handleEditDisposal(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Editar datos del expediente"
          >
            ✏️ Editar
          </button>
        );
        if (canDo('patrimonio', 'create')) actions.push(
          <button
            key="add-assets"
            onClick={() => handleAddAssets(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Agregar bienes al expediente de baja"
          >
            📦 Agregar Bienes
          </button>
        );
        if (canDo('patrimonio', 'committee', 'assign')) actions.push(
          <button
            key="start-evaluation"
            onClick={() => handleStartEvaluation(disposal)}
            disabled={!disposalAssetCounts[disposal.id]}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm ${disposalAssetCounts[disposal.id]
              ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md transform hover:scale-105 cursor-pointer'
              : 'bg-purple-600 text-white cursor-not-allowed opacity-40'
              }`}
            title={disposalAssetCounts[disposal.id]
              ? `Iniciar evaluación técnica (${disposalAssetCounts[disposal.id]} bien${disposalAssetCounts[disposal.id] !== 1 ? 'es' : ''})`
              : 'Primero agrega bienes al expediente'
            }
          >
            📊 Iniciar Evaluación
          </button>
        );
        break;

        //necesito hacer una funcion nueva  para mejorar el diseño del reporte




      case 'UNDER_EVALUATION':
        actions.push(

          <button
            key="generate-pdf"
            onClick={async () => {
              setExportingDisposalId(disposal.id);
              try {
                let details = [];
                try {
                  details = await getDisposalDetailsByDisposalId(disposal.id);
                } catch (e) {
                  details = [];
                }
                const assetsWithQR = await generateQRsForAssets(details, disposal);
                try {
                  const blob = await pdf(
                    <ReportDocument type="bajas" items={[{ ...disposal, assets: assetsWithQR }]} meta={{ title: `Expediente ${disposal.fileNumber || ''}`, isIndividual: true }} />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `expediente_${disposal.fileNumber || 'expediente'}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Error generating disposal PDF via react-pdf, falling back:', err);
                  generateDisposalPDF && generateDisposalPDF(disposal, details);
                }
              } catch (err) {
                console.error('Error generating disposal PDF:', err);
              } finally {
                setExportingDisposalId(null);
              }
            }}
            disabled={exportingDisposalId !== null}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-1.5 ${
              exportingDisposalId === disposal.id 
                ? 'bg-green-400 cursor-wait' 
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            } text-white`}
            title="Generar PDF del expediente"
          >
            {exportingDisposalId === disposal.id ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </>
            )}
          </button>
        );
        if (canDo('patrimonio', 'disposal', 'evaluate')) actions.push(
          <button
            key="add-opinion"
            onClick={() => handleAddOpinion(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Agregar opinión técnica sobre los bienes"
          >
            📋 Opinión Técnica
          </button>
        );
        if (canDo('patrimonio', 'disposal', 'approve')) actions.push(
          <button
            key="resolve"
            onClick={() => handleResolve(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Aprobar o rechazar el expediente (solo Admin. Finanzas)"
          >
            ⚖️ Aprobar/Rechazar
          </button>
        );
        break;

      case 'APPROVED':
        actions.push(

          <button
            key="generate-pdf"
            onClick={async () => {
              setExportingDisposalId(disposal.id);
              try {
                let details = [];
                try {
                  details = await getDisposalDetailsByDisposalId(disposal.id);
                } catch (e) {
                  details = [];
                }
                const assetsWithQR = await generateQRsForAssets(details, disposal);
                try {
                  const blob = await pdf(
                    <ReportDocument type="bajas" items={[{ ...disposal, assets: assetsWithQR }]} meta={{ title: `Expediente ${disposal.fileNumber || ''}`, isIndividual: true }} />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `expediente_${disposal.fileNumber || 'expediente'}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Error generating disposal PDF via react-pdf, falling back:', err);
                  generateDisposalPDF && generateDisposalPDF(disposal, details);
                }
              } catch (err) {
                console.error('Error generating disposal PDF:', err);
              } finally {
                setExportingDisposalId(null);
              }
            }}
            disabled={exportingDisposalId !== null}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-1.5 ${
              exportingDisposalId === disposal.id 
                ? 'bg-green-400 cursor-wait' 
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            } text-white`}
            title="Generar PDF del expediente"
          >
            {exportingDisposalId === disposal.id ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF
              </>
            )}
          </button>
        );
        if (canDo('patrimonio', 'disposal', 'execute')) actions.push(
          <button
            key="finalize"
            onClick={() => handleFinalize(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            🏁 Finalizar
          </button>
        );
        break;

      case 'EXECUTED':
        actions.push(

          <button
            key="generate-pdf"
            onClick={async () => {
              setExportingDisposalId(disposal.id);
              try {
                let details = [];
                try {
                  details = await getDisposalDetailsByDisposalId(disposal.id);
                } catch (e) {
                  details = [];
                }
                const assetsWithQR = await generateQRsForAssets(details, disposal);
                try {
                  const blob = await pdf(
                    <ReportDocument type="bajas" items={[{ ...disposal, assets: assetsWithQR }]} meta={{ title: `Expediente ${disposal.fileNumber || ''}`, isIndividual: true }} />
                  ).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `expediente_${disposal.fileNumber || 'expediente'}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Error generating disposal PDF via react-pdf, falling back:', err);
                  generateDisposalPDF && generateDisposalPDF(disposal, details);
                }
              } catch (err) {
                console.error('Error generating disposal PDF:', err);
              } finally {
                setExportingDisposalId(null);
              }
            }}
            disabled={exportingDisposalId !== null}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-1.5 ${
              exportingDisposalId === disposal.id 
                ? 'bg-green-400 cursor-wait' 
                : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            } text-white`}
            title="Generar PDF del expediente"
          >
            {exportingDisposalId === disposal.id ? (
              <>
                📄 Generando...
              </>
            ) : (
              <>
                📄 PDF
              </>
            )}
          </button>,
          <button
            key="sbn-report"
            onClick={async () => {
              setExportingDisposalId(disposal.id);
              try {
                let details = [];
                try {
                  details = await getDisposalDetailsByDisposalId(disposal.id);
                } catch (e) {
                  details = [];
                }
                const assetsWithQR = await generateQRsForAssets(details, disposal);
                const blob = await pdf(
                  <DisposalSBNReport
                    disposal={disposal}
                    assets={assetsWithQR}
                    meta={{
                      patrimonyHeadName: '',
                      committeePresidentName: '',
                      adminHeadName: '',
                    }}
                  />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `reporte_sbn_${disposal.fileNumber || 'expediente'}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Error generating SBN report:', err);
              } finally {
                setExportingDisposalId(null);
              }
            }}
            disabled={exportingDisposalId !== null}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-1.5 ${
              exportingDisposalId === disposal.id
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            } text-white`}
            title="Generar reporte SBN completo del expediente"
          >
            {exportingDisposalId === disposal.id ? (
              <>📋 Generando...</>
            ) : (
              <>📋 Reporte SBN</>
            )}
          </button>
        );
        if (canDo('patrimonio', 'disposal', 'execute')) actions.push(
          <button
            key="restore"
            onClick={() => handleRestore(disposal)}
            className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            title="Restaurar bienes a estado AVAILABLE"
          >
            🔄 Restaurar
          </button>
        );
        break;

      case 'REJECTED':
      case 'RESTORED':
      case 'CANCELLED':
        // No hay acciones disponibles para estos estados
        break;
    }

    // Botones comunes
    if (disposal.fileStatus !== 'EXECUTED' &&
      disposal.fileStatus !== 'RESTORED') {
      canDo('patrimonio', 'disposal', 'execute') && actions.push(
        <button
          key="cancel"
          onClick={() => handleCancel(disposal)}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        >
          🚫 Cancelar
        </button>
      );
    }

    // Botón siempre visible
    actions.push(
      <button
        key="view-assets"
        onClick={() => { setSelectedDisposal(disposal); setShowAssetsModal(true); }}
        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
        title="Ver bienes del expediente"
      >
        👁 Ver Bienes
      </button>
    );

    return actions;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatistics = () => {
    return {
      total: disposals.length,
      initiated: disposals.filter(d => d.fileStatus === 'INITIATED').length,
      underEvaluation: disposals.filter(d => d.fileStatus === 'UNDER_EVALUATION').length,
      approved: disposals.filter(d => d.fileStatus === 'APPROVED').length,
      executed: disposals.filter(d => d.fileStatus === 'EXECUTED').length,
    };
  };

  const stats = getStatistics();

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6">
      {/* Header - Slate 800 Profesional */}
      <div className="bg-slate-800 shadow-lg mb-6 sm:mb-8 rounded-2xl">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
                <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Gestión de Bajas de Bienes Patrimoniales
                </h1>
                <p className="text-slate-200 text-xs sm:text-sm font-medium">
                  Administre los expedientes de baja de bienes patrimoniales
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={async () => {
                  if (filteredDisposals.length === 0) return;
                  setIsExporting(true);
                  try {
                    // Cargar detalles de todos los expedientes
                    const disposalsWithDetails = await Promise.all(
                      filteredDisposals.map(async (d) => {
                        try {
                          const details = await getDisposalDetailsByDisposalId(d.id);
                          return { ...d, assets: details || [] };
                        } catch (e) {
                          console.error('Error loading details for disposal:', d.id, e);
                          return { ...d, assets: [] };
                        }
                      })
                    );
                    // Generar PDF
                    const blob = await pdf(
                      <ReportDocument type="bajas" items={disposalsWithDetails} meta={{ title: 'Listado de Expedientes de Baja', badge: 'LISTADO DE BAJAS' }} />
                    ).toBlob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `reporte_expedientes_${new Date().toISOString().slice(0, 10)}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error('Error generating PDF:', err);
                    Swal.fire({
                      title: 'Error al exportar',
                      text: 'No se pudo generar el reporte PDF',
                      icon: 'error',
                      confirmButtonColor: '#475569',
                    });
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting || filteredDisposals.length === 0}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Preparando...' : 'Exportar PDF'}
              </button>
              {canDo('patrimonio', 'create') && <button
                onClick={handleCreateDisposal}
                className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-transparent border-2 border-white/70 hover:bg-white/20 text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="hidden sm:inline">Nuevo Expediente</span>
                <span className="sm:hidden">Nuevo</span>
              </button>}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Profesionales */}
      <div className="mb-4 sm:mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border-l-4 border-l-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Iniciados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.initiated}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-yellow-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">En Evaluación</p>
                <p className="text-3xl font-bold text-slate-800">{stats.underEvaluation}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-50 text-yellow-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Aprobados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-l-4 border-l-purple-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Ejecutados</p>
                <p className="text-3xl font-bold text-slate-800">{stats.executed}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Modernos */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Buscar
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cualquier campo..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500/20 transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Estado
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-slate-500/20 transition-all text-sm"
              >
                {DISPOSAL_STATUS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
              Tipo
            </label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-slate-500/20 transition-all text-sm"
              >
                <option value="ALL">Todos</option>
                {DISPOSAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Profesional */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative min-h-[200px]">
        {loading ? (
          <ContentLoading isLoading={true} message="Cargando expedientes de baja patrimonial..." />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadDisposals}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        ) : filteredDisposals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-700 mb-2">No se encontraron expedientes</p>
            <p className="text-slate-500">Intenta con otros filtros o crea un nuevo expediente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th
                    onClick={() => handleSort('fileNumber')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Expediente</span>
                      {getSortIcon('fileNumber')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('disposalType')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Tipo</span>
                      {getSortIcon('disposalType')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('fileStatus')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Estado</span>
                      {getSortIcon('fileStatus')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Fecha</span>
                      {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDisposals.map(disposal => (
                  <tr key={disposal.id} className="group hover:bg-slate-50 transition-all duration-200 border-l-4 border-l-slate-800 hover:border-l-slate-700 bg-white">
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {disposal.fileNumber}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-1">
                          {disposal.disposalReason}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {getTypeBadge(disposal.disposalType)}
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(disposal.fileStatus)}
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const { date, label } = getRelevantDate(disposal);
                        return date ? (
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {formatDateOnly(date)}
                            </p>
                            <p className="text-xs text-slate-500">{label}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2 flex-wrap">
                        {getActionButtons(disposal)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDisposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadDisposals();
          setShowCreateModal(false);
        }}
      />

      {selectedDisposal && showEditModal && (
        <CreateDisposalModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDisposal(null);
          }}
          onSuccess={() => {
            loadDisposals();
            setShowEditModal(false);
            setSelectedDisposal(null);
          }}
          disposal={selectedDisposal}
        />
      )}

      {selectedDisposal && (
        <>
          <AddAssetsToDisposalModal
            isOpen={showAddAssetsModal}
            onClose={() => {
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={async () => {
              setShowAddAssetsModal(false);
              setSelectedDisposal(null);
              // Recargar para actualizar conteo de bienes
              await loadDisposals();
            }}
            disposal={selectedDisposal}
          />

          <StartEvaluationModal
            isOpen={showStartEvaluationModal}
            onClose={() => {
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowStartEvaluationModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />

          <TechnicalOpinionModal
            isOpen={showTechnicalOpinionModal}
            onClose={() => {
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowTechnicalOpinionModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
            currentUserId={user?.id}
          />

          <ResolveDisposalModal
            isOpen={showResolveModal}
            onClose={() => {
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            onSuccess={() => {
              loadDisposals();
              setShowResolveModal(false);
              setSelectedDisposal(null);
            }}
            disposal={selectedDisposal}
          />
        </>
      )}

      <ViewDisposalAssetsModal
        isOpen={showAssetsModal}
        onClose={() => { setShowAssetsModal(false); setSelectedDisposal(null); }}
        disposal={selectedDisposal}
      />
    </div>
  );
};