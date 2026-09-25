import React, { useState, useEffect } from 'react';
import { addTechnicalOpinion, getDisposalWithAssets, RECOMMENDATIONS } from '../../services/disposalService';

/**
 * Modal para agregar opinión técnica sobre los bienes del expediente
 * 
 * ESTADO REQUERIDO: UNDER_EVALUATION
 * Permite al técnico evaluar cada bien y dar recomendación
 */
export default function TechnicalOpinionModal({ isOpen, onClose, onSuccess, disposal, currentUserId }) {
  const [opinions, setOpinions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [error, setError] = useState(null);

  // Cargar expediente con sus bienes
  useEffect(() => {
    if (isOpen && disposal) {
      loadDisposalWithAssets();
    }
  }, [isOpen, disposal]);

  const loadDisposalWithAssets = async () => {
    try {
      setLoadingAssets(true);
      setError(null);
      const data = await getDisposalWithAssets(disposal.id);
      
      // Inicializar opiniones para cada bien
      if (data.disposalAssets?.length > 0) {
        const initialOpinions = data.disposalAssets.map(asset => ({
          assetId: asset.assetId,
          detailId: asset.id,
          assetCode: asset.assetCode,
          assetDescription: asset.assetDescription,
          assetModel: asset.assetModel,
          conservationStatus: asset.conservationStatus,
          technicalOpinion: asset.technicalOpinion || '',
          recommendation: asset.recommendation || 'DESTROY',
          observations: asset.observations || '',
        }));
        setOpinions(initialOpinions);
      }
    } catch (err) {
      setError('Error al cargar los bienes del expediente');
      console.error('Error al cargar expediente:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleOpinionChange = (detailId, field, value) => {
    setOpinions(prev =>
      prev.map(op => op.detailId === detailId ? { ...op, [field]: value } : op)
    );
  };

  const validateForm = () => {
    for (const opinion of opinions) {
      if (!opinion.technicalOpinion.trim()) {
        setError(`Debe ingresar una opinión técnica para el bien ${opinion.assetCode}`);
        return false;
      }
      if (!opinion.recommendation) {
        setError(`Debe seleccionar una recomendación para el bien ${opinion.assetCode}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const promises = opinions.map(opinion =>
        addTechnicalOpinion(opinion.detailId, {
          municipalityId: disposal.municipalityId,
          disposalId: disposal.id,
          assetId: opinion.assetId,
          evaluatorId: currentUserId,
          technicalOpinion: opinion.technicalOpinion || '',
          recommendation: opinion.recommendation,
          observations: opinion.observations || '',
        })
      );

      await Promise.all(promises);
      setOpinions([]);

      console.log('Opiniones técnicas guardadas correctamente');
      console.log(`Expediente: ${disposal.fileNumber}`);
      console.log(`Bienes evaluados: ${opinions.length}`);
      console.log('Recomendaciones aplicadas:');
      opinions.forEach((opinion, index) => {
        console.log(`   ${index + 1}. ${opinion.assetCode} - ${opinion.recommendation}`);
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al agregar las opiniones técnicas');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation) => {
    const colors = {
      DESTROY: 'bg-red-100 text-red-800 border-red-300',
      DONATE: 'bg-blue-100 text-blue-800 border-blue-300',
      SELL: 'bg-green-100 text-green-800 border-green-300',
      RECYCLE: 'bg-teal-100 text-teal-800 border-teal-300',
      TRANSFER: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return colors[recommendation] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getConservationColor = (status) => {
    const colors = {
      NUEVO: 'bg-green-100 text-green-800',
      BUENO: 'bg-blue-100 text-blue-800',
      REGULAR: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-red-100 text-red-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  📋 Agregar Opiniones Técnicas
                </h3>
                <p className="text-teal-100 text-sm mt-1">
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
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {loadingAssets ? (
                <div className="text-center py-8 text-slate-500">
                  Cargando bienes del expediente...
                </div>
              ) : opinions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-slate-500">
                    No hay bienes en este expediente para evaluar
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Nota informativa */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Instrucciones</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Proporcione una opinión técnica detallada para cada bien patrimonial, evaluando su estado actual y recomendando la acción más apropiada.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de bienes para evaluar */}
                  <div className="space-y-4">
                    {opinions.map((opinion, index) => (
                      <div key={opinion.detailId} className="bg-white border-2 border-slate-200 rounded-lg p-5">
                        {/* Header del bien */}
                        <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                                {index + 1}
                              </span>
                              <h5 className="font-semibold text-slate-800">
                                {opinion.assetModel}
                              </h5>
                            </div>
                            <p className="text-sm text-slate-600 ml-8">
                              {opinion.assetDescription}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConservationColor(opinion.conservationStatus)}`}>
                            {opinion.conservationStatus}
                          </span>
                        </div>

                        {/* Formulario de opinión */}
                        <div className="space-y-4">
                          {/* Opinión Técnica */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              💭 Opinión Técnica <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={opinion.technicalOpinion}
                              onChange={(e) => handleOpinionChange(opinion.detailId, 'technicalOpinion', e.target.value)}
                              placeholder="Describa su evaluación técnica del estado del bien..."
                              rows={3}
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                            />
                          </div>

                          {/* Recomendación */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              🎯 Recomendación <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {RECOMMENDATIONS.map(rec => (
                                <button
                                  key={rec.value}
                                  type="button"
                                  onClick={() => handleOpinionChange(opinion.detailId, 'recommendation', rec.value)}
                                  className={`px-3 py-2 border-2 rounded-lg text-sm font-medium transition ${opinion.recommendation === rec.value
                                    ? getRecommendationColor(rec.value) + ' shadow-sm'
                                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                  {rec.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Observaciones */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              📝 Observaciones Adicionales
                            </label>
                            <textarea
                              value={opinion.observations}
                              onChange={(e) => handleOpinionChange(opinion.detailId, 'observations', e.target.value)}
                              placeholder="Observaciones adicionales (opcional)..."
                              rows={2}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t">
              <p className="text-sm text-slate-600">
                {opinions.length} bien(es) para evaluar
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingAssets || opinions.length === 0}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Opiniones'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
