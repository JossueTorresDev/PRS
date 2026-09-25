import React, { useState, useEffect } from 'react';
import { createDisposalRequest, DISPOSAL_TYPES } from '../../services/disposalService';
import { getMunicipalityId, getUserId } from '../../../../shared/utils/municipalityHelper.js';
import { uploadAssetDocument, deleteAssetDocument, validateFile, formatFileSize } from '../../services/uploadService';

/**
 * Modal para crear solicitud de baja desde un bien específico
 * Incluye validación de UUID para technicalReportAuthorId
 */

/**
 * Modal para crear solicitud de baja de bien patrimonial
 * Flujo: Personal autorizado → Informe técnico → Aprobación Admin. Finanzas
 */
export default function DisposalRequestModal({ isOpen, onClose, onSuccess, bien }) {
  const userId = getUserId();

  const [formData, setFormData] = useState({
    // Datos del bien
    assetId: bien?.id || '',
    assetCode: bien?.assetCode || '',

    // Tipo de baja (según backend: ADMINISTRATIVE, TECHNICAL, FORTUITOUS, OBSOLESCENCE)
    disposalType: 'OBSOLESCENCE',

    // Autor del informe técnico (✅ NUEVO CAMPO REQUERIDO)
    // IMPORTANTE: Debe ser un UUID válido, no puede ser null/undefined/empty
    technicalReportAuthorId: userId,

    // Motivo y descripción
    disposalReason: '',
    reasonDescription: '',

    // Documentación de respaldo
    supportingDocuments: '', // JSON string

    // Estado y recuperación
    recoverableValue: 0,
    allowsDonation: false,
    requiresDestruction: false,

    // Observaciones
    observations: '',

    // Usuario solicitante
    requestedBy: userId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const DISPOSAL_TYPES = {
    ADMINISTRATIVE: { label: 'Administrativa', icon: '📋', color: 'blue' },
    TECHNICAL: { label: 'Técnica', icon: '🔧', color: 'orange' },
    FORTUITOUS: { label: 'Fortuita', icon: '⚡', color: 'red' },
    OBSOLESCENCE: { label: 'Obsolescencia', icon: '⏳', color: 'yellow' },
  };

  const PHYSICAL_CONDITIONS = {
    INSERVIBLE: { label: 'Inservible', color: 'red' },
    DETERIORADO: { label: 'Deteriorado', color: 'orange' },
    OBSOLETO: { label: 'Obsoleto', color: 'yellow' },
    FUNCIONAL: { label: 'Funcional (para donación/venta)', color: 'green' },
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Motivos de baja disponibles (select fijo)
  const AVAIL_REASONS = [
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
    // 1. UUID del autor
    if (!formData.technicalReportAuthorId || formData.technicalReportAuthorId.trim() === '') {
      setError('❌ No hay usuario autenticado. Por favor, inicia sesión nuevamente.');
      return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formData.technicalReportAuthorId)) {
      setError('❌ El ID de usuario no tiene formato válido. Contacta al administrador.');
      return false;
    }

    // 2. Motivo de baja (obligatorio, no puede quedar vacío)
    if (!formData.disposalReason || !formData.disposalReason.trim()) {
      setError('❌ Debe seleccionar un motivo de baja. Este campo es obligatorio.');
      return false;
    }

    // 3. Descripción detallada (obligatorio + mínimo 20 chars)
    if (!formData.reasonDescription || !formData.reasonDescription.trim()) {
      setError('❌ La descripción detallada es obligatoria. No puede quedar vacía.');
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

    // 4. Valor recuperable (no negativo)
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
    const hasData = formData.disposalReason || formData.reasonDescription || formData.observations;
    if (hasData && !window.confirm('¿Está seguro que desea cancelar? Los datos ingresados se perderán.')) {
      return;
    }
    onClose();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error);
        continue;
      }

      const result = await uploadAssetDocument(file, 'DISPOSAL');
      if (result.success) {
        setUploadedFiles(prev => [...prev, result]);
      } else {
        setUploadError(result.error);
      }
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleRemoveFile = async (index) => {
    const fileToRemove = uploadedFiles[index];
    if (fileToRemove.path) {
      await deleteAssetDocument(fileToRemove.path);
    }
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
      const supportingDocuments = uploadedFiles.map(f => ({
        type: f.fileType?.includes('pdf') ? 'TECHNICAL_REPORT' : 'PHOTO',
        name: f.fileName,
        url: f.url,
      }));

      const payload = {
        municipalityId: getMunicipalityId(),
        disposalType: formData.disposalType,
        disposalReason: formData.disposalReason,
        reasonDescription: formData.reasonDescription,
        technicalReportAuthorId: formData.technicalReportAuthorId,
        observations: formData.observations || null,
        requiresDestruction: formData.requiresDestruction || false,
        allowsDonation: formData.allowsDonation || false,
        recoverableValue: parseFloat(formData.recoverableValue) || 0,
        requestedBy: formData.requestedBy,
        supportingDocuments,
      };

      await createDisposalRequest(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la solicitud de baja');
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
          className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Solicitud de Baja de Bien Patrimonial
                </h3>
                <p className="text-red-100 text-sm mt-1">
                  Bien: {bien?.assetCode} - {bien?.description}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-red-100 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información del Bien
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Código:</span>
                  <span className="ml-2 font-semibold text-slate-800">{bien?.assetCode}</span>
                </div>
                <div>
                  <span className="text-slate-600">Valor:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {bien?.currency} {bien?.acquisitionValue?.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-600">Descripción:</span>
                  <span className="ml-2 font-semibold text-slate-800">{bien?.description}</span>
                </div>
              </div>
            </div>

            {/* Autor del Informe Técnico */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Autor del Informe Técnico
              </h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ID del Autor del Informe Técnico <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="technicalReportAuthorId"
                  value={formData.technicalReportAuthorId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="UUID del usuario (ej: 123e4567-e89b-12d3-a456-426614174000)"
                />
                <p className="text-xs text-slate-500 mt-1">
                  ℹ️ Se asigna automáticamente del usuario autenticado. Debe ser un UUID válido.
                </p>
                {formData.technicalReportAuthorId && (
                  <div className="mt-2">
                    <p className={`text-xs font-semibold ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.technicalReportAuthorId)
                        ? 'text-green-600'
                        : 'text-red-600'
                      }`}>
                      {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.technicalReportAuthorId)
                        ? '✅ UUID válido'
                        : '❌ UUID inválido - debe tener formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tipo y Motivo de Baja */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Tipo y Motivo de Baja
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Baja <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(DISPOSAL_TYPES).map(([key, { label, icon, color }]) => (
                      <label
                        key={key}
                        className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition ${formData.disposalType === key
                            ? `border-${color}-500 bg-${color}-50`
                            : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="disposalType"
                          value={key}
                          checked={formData.disposalType === key}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-2xl mb-1">{icon}</div>
                          <div className="text-xs font-medium text-slate-700">{label}</div>
                        </div>
                      </label>
                    ))}
                  </div>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!formData.disposalReason ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                  >
                    <option value="">-- Seleccione un motivo de baja --</option>
                    {AVAIL_REASONS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {!formData.disposalReason && (
                    <p className="text-xs text-red-500 mt-1">⚠️ El motivo de baja es obligatorio</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descripción Detallada <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs text-slate-400 font-normal">
                      ({descLen}/1000) — mín. 20 caracteres
                    </span>
                  </label>
                  <textarea
                    name="reasonDescription"
                    value={formData.reasonDescription}
                    onChange={handleChange}
                    required
                    rows="4"
                    maxLength={1000}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${descInvalid ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                    placeholder="Describa detalladamente las razones técnicas que justifican la baja del bien (mín. 20 caracteres)..."
                  />
                  {descInvalid && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Faltan {20 - descLen} caracteres para el mínimo requerido</p>
                  )}
                  {!formData.reasonDescription && (
                    <p className="text-xs text-red-500 mt-1">⚠️ La descripción detallada es obligatoria</p>
                  )}
                </div>
              </div>
            </div>

            {/* Estado Físico y Recuperación */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Valor y Recuperación
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Valor Recuperable (S/)
                  </label>
                  <input
                    type="number"
                    name="recoverableValue"
                    value={formData.recoverableValue}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-end">
                  <div className="space-y-2 w-full">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="allowsDonation"
                        checked={formData.allowsDonation}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">
                        ✅ Permite donación
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="requiresDestruction"
                        checked={formData.requiresDestruction}
                        onChange={handleChange}
                        className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-700">
                        🗑️ Requiere destrucción
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Documentación de Respaldo
              </h4>
              {uploadError && (
                <div className="mb-2 bg-red-50 border-l-4 border-red-500 p-2 rounded text-sm text-red-700">
                  {uploadError}
                </div>
              )}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {uploading ? (
                    <p className="mt-2 text-sm text-blue-600 font-medium">Subiendo archivo...</p>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-slate-600">
                        Click para adjuntar informe técnico, fotos, etc.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        PDF, DOC, DOCX, JPG, PNG (máx. 5MB por archivo)
                      </p>
                    </>
                  )}
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">
                          {file.fileType?.includes('pdf') ? '📄' : file.fileType?.includes('image') ? '🖼️' : '📎'}
                        </span>
                        <span className="text-sm text-slate-700 truncate">{file.fileName}</span>
                        <span className="text-xs text-slate-400">{formatFileSize(file.fileSize)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700 transition p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional relevante para la evaluación..."
              />
            </div>

            {/* Información del Proceso */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Proceso de Baja - Flujo Actualizado
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Esta solicitud iniciará el proceso de baja (estado: <strong>INITIATED</strong>).
                    Posteriormente será asignada para evaluación técnica y finalmente aprobada o rechazada por el <strong>Administrador de Finanzas</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Enviar Solicitud
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
