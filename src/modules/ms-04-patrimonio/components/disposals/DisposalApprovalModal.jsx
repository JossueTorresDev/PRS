import React, { useState } from 'react';
import { resolveDisposal } from '../../services/disposalService';
import { formatDateOnly } from '../../utils/dateUtils';
import { getUserId } from '../../../../shared/utils/municipalityHelper.js';

/**
 * Modal para aprobar o rechazar expedientes de baja
 * 
 * ROL: Administrador de Finanzas
 * 
 * FLUJO:
 * - Aprobar: Requiere N° de Resolución + observaciones opcionales
 * - Rechazar: Requiere motivo del rechazo
 * - Usa campo approvedById (NO resolvedBy)
 */

/**
 * Modal para aResponse de cancelDisposal: 123e4567-e89b-12d3-a456-426614174000 ee45ad9e-1f59-4ddb-a388-0fa6e63b9881 probar o rechazar solicitudes de baja (Admin. Finanzas)
 * Usa el endpoint PUT /asset-disposals/{id}/resolve con approvedById
 */
export default function DisposalApprovalModal({ isOpen, onClose, onSuccess, solicitud }) {
  const [action, setAction] = useState(null); // 'approve' | 'reject'
  const [formData, setFormData] = useState({
    resolutionNumber: '',
    observations: '',
    approvedById: getUserId() || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.resolutionNumber.trim()) {
        throw new Error('El número de resolución es obligatorio para aprobar');
      }

      const payload = {
        approved: true, // ✅ Indica aprobación
        resolutionNumber: formData.resolutionNumber,
        observations: formData.observations || null,
        approvedById: formData.approvedById, // ✅ Campo renombrado del backend
      };

      await resolveDisposal(solicitud.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al aprobar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.observations.trim()) {
        throw new Error('Debe especificar el motivo del rechazo');
      }

      const payload = {
        approved: false, // ✅ Indica rechazo
        resolutionNumber: null,
        observations: formData.observations, // El motivo del rechazo va aquí
        approvedById: formData.approvedById, // ✅ Campo renombrado del backend
      };

      await resolveDisposal(solicitud.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al rechazar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !solicitud) return null;

  const DISPOSAL_TYPE_LABELS = {
    ADMINISTRATIVE: 'Administrativa',
    TECHNICAL: 'Técnica',
    FORTUITOUS: 'Fortuita',
    OBSOLESCENCE: 'Obsolescencia',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Revisar Solicitud de Baja
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Administrador de Finanzas - Aprobación/Rechazo
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Información del Bien */}
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Bien Patrimonial
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Código</p>
                  <p className="font-semibold text-lg text-slate-800">{solicitud.assetCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Valor</p>
                  <p className="font-semibold text-lg text-green-600">
                    S/ {solicitud.assetValue?.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-slate-800">{solicitud.assetDescription}</p>
                </div>
              </div>
            </div>

            {/* Información de la Solicitud */}
            <div className="border border-slate-200 rounded-lg p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detalles de la Solicitud
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Tipo de Baja</p>
                    <p className="font-medium text-slate-800">
                      {DISPOSAL_TYPE_LABELS[solicitud.disposalType] || solicitud.disposalType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">N° Expediente</p>
                    <p className="font-medium text-slate-800">{solicitud.fileNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Fecha Solicitud</p>
                    <p className="font-medium text-slate-800">
                      {formatDateOnly(solicitud.requestDate || solicitud.createdAt, 'es-PE')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Solicitado Por</p>
                    <p className="font-medium text-slate-800">{solicitud.requestedBy || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Motivo de Baja</p>
                  <p className="text-slate-800 font-medium">{solicitud.disposalReason}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Descripción Detallada</p>
                  <div className="bg-slate-50 rounded p-3 text-sm text-slate-700">
                    {solicitud.reasonDescription}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Valor Recuperable</p>
                    <p className="font-semibold text-green-600">S/ {solicitud.recoverableValue || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Permite Donación</p>
                    <p className="font-medium">
                      {solicitud.allowsDonation ? '✅ Sí' : '❌ No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Requiere Destrucción</p>
                    <p className="font-medium">
                      {solicitud.requiresDestruction ? '🗑️ Sí' : '❌ No'}
                    </p>
                  </div>
                </div>

                {solicitud.observations && (
                  <div>
                    <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Observaciones</p>
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-3 text-sm text-slate-700">
                      {solicitud.observations}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sección de Aprobación/Rechazo */}
            {!action ? (
              <div className="flex gap-4">
                <button
                  onClick={() => setAction('reject')}
                  className="flex-1 px-6 py-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-red-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-bold text-red-700">Rechazar Solicitud</p>
                      <p className="text-xs text-red-600">La solicitud será devuelta al solicitante</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setAction('approve')}
                  className="flex-1 px-6 py-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-green-600 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="font-bold text-green-700">Aprobar Solicitud</p>
                      <p className="text-xs text-green-600">El bien será dado de baja</p>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className={`border-2 rounded-lg p-6 ${
                action === 'approve' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}>
                <h4 className={`font-bold text-lg mb-4 ${action === 'approve' ? 'text-green-800' : 'text-red-800'}`}>
                  {action === 'approve' ? '✅ Aprobar Solicitud de Baja' : '❌ Rechazar Solicitud de Baja'}
                </h4>

                {action === 'approve' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        N° de Resolución <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="resolutionNumber"
                        value={formData.resolutionNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="RES-2025-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Observaciones (Opcional)
                      </label>
                      <textarea
                        name="observations"
                        value={formData.observations}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Observaciones o instrucciones adicionales..."
                      />
                    </div>
                  </div>
                )}

                {action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motivo del Rechazo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="observations"
                      value={formData.observations}
                      onChange={handleChange}
                      required
                      rows="4"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Explique detalladamente las razones del rechazo..."
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setAction(null)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={action === 'approve' ? handleApprove : handleReject}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                      action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        {action === 'approve' ? '✅ Confirmar Aprobación' : '❌ Confirmar Rechazo'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
