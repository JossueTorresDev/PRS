import React, { useState, useEffect } from 'react';
import { resolveDisposal, getAllDisposals } from '../../services/disposalService';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';

/**
 * Modal para resolver (aprobar/rechazar) un expediente de baja
 * 
 * DEPRECADO: Usar DisposalApprovalModal en su lugar
 * Este componente se mantiene por compatibilidad
 */

export default function ResolveDisposalModal({ isOpen, onClose, onSuccess, disposal }) {
  const [formData, setFormData] = useState({
    approved: true,
    resolutionNumber: '',
    resolutionDate: new Date().toISOString().split('T')[0],
    technicalReport: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingResolutions, setExistingResolutions] = useState([]);

  // Cargar resoluciones existentes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadExistingResolutions();
    }
  }, [isOpen]);

  // Auto-generar número cuando se cargan las resoluciones
  useEffect(() => {
    if (isOpen && existingResolutions.length >= 0 && formData.resolutionNumber === '') {
      generateUniqueResolutionNumber();
    }
  }, [isOpen, existingResolutions]);

  const loadExistingResolutions = async () => {
    try {
      const municipalityId = getMunicipalityId();
      const disposals = await getAllDisposals();
      // Filtrar por municipalityId (client-side)
      const filteredDisposals = disposals.filter(d => !municipalityId || d.municipalityId === municipalityId);
      const resolutions = filteredDisposals
        .filter(d => d.resolutionNumber)
        .map(d => d.resolutionNumber.trim().toUpperCase());
      setExistingResolutions(resolutions);
    } catch (err) {
      console.error('Error al cargar resoluciones:', err);
    }
  };

  const generateUniqueResolutionNumber = () => {
    const currentYear = new Date().getFullYear();
    const municipalityCode = disposal?.municipalityId?.substring(0, 4).toUpperCase() || 'MUNI';
    
    // Buscar el último secuencial del año actual
    const thisYearResolutions = existingResolutions.filter(res => 
      res.includes(`-${currentYear}-`)
    );
    
    let nextSequential = 1;
    if (thisYearResolutions.length > 0) {
      const sequentials = thisYearResolutions.map(res => {
        const parts = res.split('-');
        const lastPart = parts[parts.length - 1];
        return parseInt(lastPart) || 0;
      });
      nextSequential = Math.max(...sequentials) + 1;
    }
    
    // Generar números hasta encontrar uno único
    let generatedNumber;
    let sequential = nextSequential;
    do {
      const paddedSequential = String(sequential).padStart(4, '0');
      generatedNumber = `RES-BAJA-${municipalityCode}-${currentYear}-${paddedSequential}`;
      sequential++;
    } while (existingResolutions.includes(generatedNumber.toUpperCase()));
    
    setFormData(prev => ({
      ...prev,
      resolutionNumber: generatedNumber,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApprovalToggle = (approved) => {
    setFormData(prev => ({
      ...prev,
      approved,
    }));
  };

  const validateForm = () => {
    if (!formData.resolutionNumber.trim()) {
      setError('Debe ingresar el número de resolución');
      return false;
    }
    if (!formData.resolutionDate) {
      setError('Debe especificar la fecha de resolución');
      return false;
    }
    if (!formData.technicalReport.trim()) {
      setError('Debe ingresar el informe técnico');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resolveDisposal(disposal.id, {
        approved: formData.approved,
        resolutionNumber: formData.resolutionNumber,
        observations: formData.technicalReport,
      });

      // Reset form
      setFormData({
        approved: true,
        resolutionNumber: '',
        resolutionDate: new Date().toISOString().split('T')[0],
        technicalReport: '',
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al resolver el expediente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          <div className={`bg-gradient-to-r ${
            formData.approved 
              ? 'from-green-600 to-green-700' 
              : 'from-red-600 to-red-700'
          } px-6 py-5 transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {formData.approved ? '✅ Aprobar' : '❌ Rechazar'} Expediente
                </h3>
                <p className="text-white text-opacity-90 text-sm mt-1">
                  Expediente: {disposal?.fileNumber}
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
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Toggle Aprobar/Rechazar */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Decisión <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleApprovalToggle(true)}
                      className={`px-6 py-4 border-2 rounded-lg font-medium transition ${
                        formData.approved
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Aprobar</span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">
                        Autorizar la baja de los bienes
                      </p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleApprovalToggle(false)}
                      className={`px-6 py-4 border-2 rounded-lg font-medium transition ${
                        !formData.approved
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Rechazar</span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">
                        Denegar la solicitud de baja
                      </p>
                    </button>
                  </div>
                </div>

                {/* Información del expediente */}
                <div className={`rounded-lg p-4 border-2 ${
                  formData.approved 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    formData.approved ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Información del Expediente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Número:</span>
                      <span className="font-medium ml-2">{disposal?.fileNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Tipo:</span>
                      <span className="font-medium ml-2">
                        {disposal?.disposalType === 'OBSOLESCENCE' && 'Obsolescencia'}
                        {disposal?.disposalType === 'DETERIORATION' && 'Deterioro'}
                        {disposal?.disposalType === 'LOSS' && 'Pérdida'}
                        {disposal?.disposalType === 'THEFT' && 'Robo'}
                        {disposal?.disposalType === 'OTHER' && 'Otro'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Estado:</span>
                      <span className="font-medium ml-2">
                        {disposal?.fileStatus === 'UNDER_EVALUATION' && 'En Evaluación'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Número de Resolución */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📄 Número de Resolución <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="resolutionNumber"
                      value={formData.resolutionNumber}
                      readOnly
                      disabled
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-2.5">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Número generado automáticamente y único en el sistema
                  </p>
                </div>

                {/* Fecha de Resolución */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📅 Fecha de Resolución <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="resolutionDate"
                    value={formData.resolutionDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Informe Técnico */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    📝 Informe Técnico <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="technicalReport"
                    value={formData.technicalReport}
                    onChange={handleChange}
                    placeholder={formData.approved 
                      ? "Describa las razones por las cuales se aprueba la baja de los bienes patrimoniales..." 
                      : "Explique los motivos del rechazo del expediente de baja..."}
                    rows={6}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.approved 
                      ? 'Justifique la aprobación de la baja basándose en las opiniones técnicas del comité'
                      : 'Indique claramente las razones del rechazo y las acciones correctivas necesarias'
                    }
                  </p>
                </div>

                {/* Advertencia */}
                <div className={`rounded-lg p-4 border ${
                  formData.approved 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex">
                    <svg className={`w-5 h-5 mr-2 flex-shrink-0 ${
                      formData.approved ? 'text-amber-600' : 'text-blue-600'
                    }`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className={`text-sm font-medium ${
                        formData.approved ? 'text-amber-800' : 'text-blue-800'
                      }`}>
                        {formData.approved ? 'Importante' : 'Nota'}
                      </p>
                      <p className={`text-xs mt-1 ${
                        formData.approved ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {formData.approved 
                          ? 'Una vez aprobado, el expediente pasará al estado "APROBADO" y podrá proceder con la ejecución de la baja de los bienes.'
                          : 'Al rechazar el expediente, este pasará al estado "RECHAZADO" y no podrá ejecutarse. Se podrá iniciar un nuevo expediente si es necesario.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  formData.approved
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {loading 
                  ? 'Procesando...' 
                  : formData.approved 
                    ? 'Aprobar Expediente' 
                    : 'Rechazar Expediente'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
