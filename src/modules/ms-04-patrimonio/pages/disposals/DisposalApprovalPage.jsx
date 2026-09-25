import React, { useState, useEffect } from 'react';
import DisposalApprovalModal from '../../components/disposals/DisposalApprovalModal';
import { getDisposalsUnderEvaluation, getDisposalRequestHistory, DISPOSAL_STATUS } from '../../services/disposalService';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';
import ContentLoading from '../../../../shared/utils/ContentLoading.jsx';
import { formatDateOnly } from '../../utils/dateUtils';

/**
 * Página para que Administrador de Finanzas gestione solicitudes de baja
 * 
 * FLUJO:
 * - Ve expedientes en estado UNDER_EVALUATION
 * - Puede Aprobar o Rechazar cada expediente
 * - Al aprobar: requiere N° de Resolución
 * - Al rechazar: requiere motivo del rechazo
 * - Usa campo approvedById (no resolvedBy)
 */
export default function DisposalApprovalPage() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const municipalityId = getMunicipalityId();
      if (activeTab === 'pending') {
        const data = await getDisposalsUnderEvaluation(); // Estado: UNDER_EVALUATION
        // Filtrar por municipalityId (client-side)
        const filteredData = data.filter(d => !municipalityId || d.municipalityId === municipalityId);
        setSolicitudesPendientes(filteredData);
      } else {
        const data = await getDisposalRequestHistory();
        // Filtrar por municipalityId (client-side)
        const filteredData = data.filter(d => !municipalityId || d.municipalityId === municipalityId);
        setHistorial(filteredData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRevisar = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSolicitud(null);
  };

  const handleSuccess = () => {
    loadData();
    handleCloseModal();
  };

  const getStatusBadge = (status) => {
    const statusConfig = DISPOSAL_STATUS.find(s => s.value === status) || 
                        { value: status, label: status, color: 'gray' };
    
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    );
  };

  const DISPOSAL_TYPE_LABELS = {
    ADMINISTRATIVE: 'Administrativa',
    TECHNICAL: 'Técnica',
    FORTUITOUS: 'Fortuita',
    OBSOLESCENCE: 'Obsolescencia',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <svg className="w-9 h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Aprobación de Bajas
            </h1>
            <p className="text-slate-600 mt-2">
              Administrador de Finanzas - Gestión de solicitudes de baja de bienes patrimoniales
            </p>
          </div>

          {activeTab === 'pending' && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg px-5 py-3">
              <div className="text-center">
                <p className="text-xs text-yellow-700 uppercase font-semibold mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-800">{solicitudesPendientes.length}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Solicitudes Pendientes
              {solicitudesPendientes.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {solicitudesPendientes.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'pending' && (
          <div>
            <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Solicitudes en estado <strong>UNDER_EVALUATION</strong> pendientes de su aprobación o rechazo</span>
              </div>
            </div>

            {loading ? (
              <div className="relative min-h-[300px]">
                <ContentLoading isLoading={true} message="Cargando solicitudes de baja pendientes de aprobación..." />
              </div>
            ) : solicitudesPendientes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <svg className="mx-auto h-16 w-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-600 text-lg font-medium">No hay solicitudes pendientes</p>
                <p className="text-slate-500 mt-1">Todas las solicitudes han sido procesadas</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {solicitudesPendientes.map((solicitud) => (
                  <div key={solicitud.id} className="bg-white border-2 border-slate-200 rounded-lg p-5 hover:shadow-lg transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="bg-slate-100 rounded-lg p-3">
                            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>

                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">
                              Código: {solicitud.assetCode || 'N/A'}
                            </h3>
                            <p className="text-slate-600 mb-3">{solicitud.assetDescription || 'Sin descripción'}</p>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-600">N° Expediente:</p>
                                <p className="font-semibold text-slate-800">{solicitud.fileNumber || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Fecha Solicitud:</p>
                                <p className="font-semibold text-slate-800">
                                  {formatDateOnly(solicitud.requestDate || solicitud.createdAt, 'es-PE')}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-600">Tipo de Baja:</p>
                                <p className="font-semibold text-slate-800">
                                  {DISPOSAL_TYPE_LABELS[solicitud.disposalType] || solicitud.disposalType}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-600">Valor Recuperable:</p>
                                <p className="font-bold text-green-600 text-lg">
                                  S/ {(solicitud.recoverableValue || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {solicitud.observations && (
                              <div className="mt-3 p-3 bg-slate-50 rounded text-sm text-slate-700">
                                <p className="font-semibold text-slate-800 mb-1">Observaciones:</p>
                                {solicitud.observations}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <button
                          onClick={() => handleRevisar(solicitud)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Revisar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {loading ? (
              <div className="relative min-h-[300px]">
                <ContentLoading isLoading={true} message="Cargando historial de aprobaciones de baja..." />
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <svg className="mx-auto h-16 w-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-600 text-lg font-medium">No hay historial disponible</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {historial.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 rounded-lg p-3">
                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-slate-800">
                              {item.assetCode || 'N/A'}
                            </h3>
                            <p className="text-slate-600">{item.assetDescription || 'Sin descripción'}</p>
                          </div>
                          {getStatusBadge(item.fileStatus)}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-slate-600">N° Expediente:</p>
                            <p className="font-semibold text-slate-800">{item.fileNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-600">Fecha:</p>
                            <p className="font-semibold text-slate-800">
                              {formatDateOnly(item.requestDate || item.createdAt, 'es-PE')}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Tipo:</p>
                            <p className="font-semibold text-slate-800">
                              {DISPOSAL_TYPE_LABELS[item.disposalType] || item.disposalType}
                            </p>
                          </div>
                        </div>

                        {item.resolutionNumber && (
                          <div className="mt-3 p-3 bg-green-50 rounded border border-green-200 text-sm">
                            <p className="text-green-800 font-semibold">
                              Resolución: {item.resolutionNumber}
                            </p>
                            {item.observations && (
                              <p className="text-green-700 mt-1">{item.observations}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Aprobación */}
      <DisposalApprovalModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        solicitud={selectedSolicitud}
      />
    </div>
  );
}
