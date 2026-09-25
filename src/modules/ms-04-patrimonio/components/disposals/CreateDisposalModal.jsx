import React, { useState, useEffect } from 'react';
import { createDisposal, updateDisposal, DISPOSAL_TYPES } from '../../services/disposalService';
import { getMunicipalityId, getUserId } from '../../../../shared/utils/municipalityHelper.js';

/**
 * Modal para crear o editar un expediente de baja
 * 
 * Si se pasa un objeto `disposal`, se abre en modo edición.
 * Solo se permite editar expedientes en estado INITIATED.
 */

export default function CreateDisposalModal({ isOpen, onClose, onSuccess, disposal }) {
  const isEditing = !!disposal;
  const userId = getUserId();
  const municipalityId = getMunicipalityId();

  const getInitialFormData = () => {
    if (disposal) {
      return {
        municipalityId: disposal.municipalityId || municipalityId,
        disposalType: disposal.disposalType || 'OBSOLESCENCE',
        disposalReason: disposal.disposalReason || '',
        reasonDescription: disposal.reasonDescription || '',
        technicalReportAuthorId: disposal.technicalReportAuthorId || userId,
        requiresDestruction: disposal.requiresDestruction ?? false,
        allowsDonation: disposal.allowsDonation ?? false,
        recoverableValue: disposal.recoverableValue ?? 0,
        observations: disposal.observations || '',
        requestedBy: disposal.requestedBy || userId,
      };
    }
    return {
      municipalityId: municipalityId,
      disposalType: 'OBSOLESCENCE',
      disposalReason: '',
      reasonDescription: '',
      technicalReportAuthorId: userId,
      requiresDestruction: false,
      allowsDonation: false,
      recoverableValue: 0,
      observations: '',
      requestedBy: userId,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, disposal]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Motivos de baja disponibles (select fijo)
  const DISPOSAL_REASONS = [
    { value: 'ESTADO_INSERVIBLE', label: 'Estado inservible - No puede repararse' },
    { value: 'OBSOLESCENCIA_TECNICA', label: 'Obsolescencia técnica - Sin soporte o repuestos' },
    { value: 'DETERIORO_FISICO', label: 'Deterioro físico grave' },
    { value: 'SINIESTRO', label: 'Siniestro (robo, incendio, desastre natural)' },
    { value: 'PERDIDA', label: 'Pérdida o extravío' },
    { value: 'DONACION_APROBADA', label: 'Donación aprobada por autoridad competente' },
    { value: 'TRANSFERENCIA_INSTITUCIONAL', label: 'Transferencia a otra institución' },
    { value: 'OTRO', label: 'Otro motivo justificado' },
  ];

  const validateForm = () => {
    // 1. Autor del informe técnico
    if (!formData.technicalReportAuthorId || formData.technicalReportAuthorId.trim() === '') {
      setError('❌ El autor del informe técnico es requerido');
      return false;
    }

    // 2. Motivo de baja (obligatorio, no puede quedar vacío)
    if (!formData.disposalReason || !formData.disposalReason.trim()) {
      setError('❌ Debe seleccionar un motivo de baja. Este campo es obligatorio.');
      return false;
    }
    if (formData.disposalReason.trim().length < 5) {
      setError('❌ El motivo de baja debe tener al menos 5 caracteres');
      return false;
    }

    // 3. Descripción del motivo (obligatorio + mínimo 20 chars)
    if (!formData.reasonDescription || !formData.reasonDescription.trim()) {
      setError('❌ La descripción del motivo es obligatoria. No puede quedar vacía.');
      return false;
    }
    if (formData.reasonDescription.trim().length < 20) {
      setError(`❌ La descripción debe tener al menos 20 caracteres (actual: ${formData.reasonDescription.trim().length})`);
      return false;
    }
    if (formData.reasonDescription.length > 1000) {
      setError('❌ La descripción no puede superar los 1000 caracteres');
      return false;
    }

    // 4. Valor recuperable (no puede ser negativo)
    const recVal = parseFloat(formData.recoverableValue);
    if (!isNaN(recVal) && recVal < 0) {
      setError('❌ El valor recuperable no puede ser negativo');
      return false;
    }

    // 5. Observaciones (longitud máxima)
    if (formData.observations && formData.observations.length > 1000) {
      setError('❌ Las observaciones no pueden superar los 1000 caracteres');
      return false;
    }

    return true;
  };

  const handleClose = () => {
    // Confirmar si hay datos cargados antes de cerrar
    const hasData = formData.disposalReason || formData.reasonDescription || formData.observations;
    if (hasData && !window.confirm('¿Está seguro que desea cancelar? Los datos ingresados se perderán.')) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        recoverableValue: parseFloat(formData.recoverableValue) || 0,
      };

      if (isEditing) {
        await updateDisposal(disposal.id, payload);
      } else {
        await createDisposal(payload);
      }

      // Resetear formulario
      setFormData(getInitialFormData());

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el expediente de baja`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const descLen = (formData.reasonDescription || '').length;
  const descInvalid = formData.reasonDescription !== '' && descLen < 20;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className={`bg-gradient-to-r px-6 py-5 ${isEditing ? 'from-amber-600 to-amber-700' : 'from-red-600 to-red-700'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {isEditing ? '✏️ Editar Expediente de Baja' : '🗑️ Nuevo Expediente de Baja'}
              </h3>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Tipo de Baja */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                📋 Información del Expediente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Baja <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="disposalType"
                    value={formData.disposalType}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {DISPOSAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Motivo de Baja <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="disposalReason"
                    value={formData.disposalReason}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${!formData.disposalReason ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                  >
                    <option value="">-- Seleccione un motivo de baja --</option>
                    {DISPOSAL_REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {!formData.disposalReason && (
                    <p className="text-xs text-red-500 mt-1">⚠️ El motivo de baja es obligatorio</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción del Motivo <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      ({descLen}/1000) — mín. 20 caracteres
                    </span>
                  </label>
                  <textarea
                    name="reasonDescription"
                    value={formData.reasonDescription}
                    onChange={handleChange}
                    required
                    rows="3"
                    maxLength={1000}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${descInvalid ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                    placeholder="Describa detalladamente el motivo de la baja (mín. 20 caracteres)..."
                  />
                  {descInvalid && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Faltan {20 - descLen} caracteres para el mínimo requerido</p>
                  )}
                  {!formData.reasonDescription && (
                    <p className="text-xs text-red-500 mt-1">⚠️ La descripción del motivo es obligatoria</p>
                  )}
                </div>
              </div>
            </div>

            {/* Opciones de Disposición */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                🔧 Opciones de Disposición
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresDestruction"
                    name="requiresDestruction"
                    checked={formData.requiresDestruction}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="requiresDestruction" className="ml-2 text-sm font-medium text-slate-700">
                    Requiere Destrucción
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowsDonation"
                    name="allowsDonation"
                    checked={formData.allowsDonation}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="allowsDonation" className="ml-2 text-sm font-medium text-slate-700">
                    Permite Donación
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Recuperable (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="recoverableValue"
                    value={formData.recoverableValue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Observaciones adicionales sobre el expediente..."
              />
            </div>
          </form>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (isEditing ? 'Guardando...' : 'Creando...')
                : (isEditing ? 'Guardar Cambios' : 'Crear Expediente')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
