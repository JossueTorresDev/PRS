import React, { useState, useEffect } from 'react';
import { getBienesPatrimoniales } from '../../services/api';
import { addAssetToDisposal, getActiveAssetIds } from '../../services/disposalService';
import { getMunicipalityId } from '../../../../shared/utils/municipalityHelper.js';

/**
 * Modal para agregar bienes a un expediente de baja
 * 
 * ESTADO REQUERIDO: INITIATED
 * 
 * Vincula bienes patrimoniales al expediente
 */
export default function AddAssetsToDisposalModal({ isOpen, onClose, onSuccess, disposal }) {
  const [bienes, setBienes] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBienes, setLoadingBienes] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [occupiedAssetIds, setOccupiedAssetIds] = useState([]);

  // Cargar bienes disponibles
  useEffect(() => {
    if (isOpen) {
      loadBienes();
    }
  }, [isOpen]);

  const loadBienes = async () => {
    try {
      setLoadingBienes(true);
      const municipalityId = getMunicipalityId();
      const data = await getBienesPatrimoniales();
      const activeIds = await getActiveAssetIds();

      setOccupiedAssetIds(activeIds || []);

      const DISPOSED_STATUSES = ['BAJA', 'DISPOSED', 'INACTIVE'];
      const availableBienes = data.filter(b => {
        const matchesMunicipality = !municipalityId || b.municipalityId === municipalityId;
        const status = (b.assetStatus || b.estadoBien || '').toUpperCase();
        const notDisposed = !DISPOSED_STATUSES.includes(status);
        return matchesMunicipality && notDisposed;
      });
      setBienes(availableBienes);
    } catch (err) {
      setError('Error al cargar los bienes patrimoniales');
    } finally {
      setLoadingBienes(false);
    }
  };

  const handleAssetSelect = (asset) => {
    // Si el bien está ocupado en otro expediente, no dejar seleccionarlo
    if (occupiedAssetIds.includes(asset.id)) return;

    const isSelected = selectedAssets.find(a => a.id === asset.id);

    if (isSelected) {
      setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
    } else {
      setSelectedAssets([...selectedAssets, {
        ...asset,
        conservationStatus: 'REGULAR',
        bookValue: asset.currentValue || asset.valorActual || asset.acquisitionValue || asset.valorAdquisicion || 0,
        recoverableValue: 0,
        observations: '',
      }]);
    }
  };

  const handleAssetDataChange = (assetId, field, value) => {
    setSelectedAssets(prevAssets =>
      prevAssets.map(asset =>
        asset.id === assetId
          ? { ...asset, [field]: value }
          : asset
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedAssets.length === 0) {
      setError('Debe seleccionar al menos un bien patrimonial');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Agregar cada bien seleccionado al expediente
      const promises = selectedAssets.map(asset =>
        addAssetToDisposal({
          municipalityId: disposal.municipalityId,
          disposalId: disposal.id,
          assetId: asset.id,
          conservationStatus: asset.conservationStatus,
          bookValue: parseFloat(asset.bookValue) || 0,
          recoverableValue: parseFloat(asset.recoverableValue) || 0,
          observations: asset.observations || '',
        })
      );

      await Promise.all(promises);

      setSelectedAssets([]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al agregar los bienes al expediente');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar bienes según búsqueda
  const filteredBienes = bienes.filter(bien =>
    (bien.assetCode || bien.codigoPatrimonial)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bien.description || bien.descripcion)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="inline-block w-full max-w-6xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  📦 Agregar Bienes al Expediente
                </h3>
                <p className="text-blue-100 text-sm mt-1">
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
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Búsqueda */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Bienes seleccionados */}
            {selectedAssets.length > 0 && (
              <div className="mb-6 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">
                  Bienes Seleccionados ({selectedAssets.length})
                </h4>
                <div className="space-y-3">
                  {selectedAssets.map(asset => (
                    <div key={asset.id} className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {asset.assetCode || asset.codigoPatrimonial}
                          </p>
                          <p className="text-sm text-slate-600">
                            {asset.description || asset.descripcion}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAssetSelect(asset)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Estado de Conservación
                          </label>
                          <select
                            value={asset.conservationStatus}
                            onChange={(e) => handleAssetDataChange(asset.id, 'conservationStatus', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="NUEVO">Nuevo</option>
                            <option value="BUENO">Bueno</option>
                            <option value="REGULAR">Regular</option>
                            <option value="MALO">Malo</option>
                            <option value="BAD">Mal Estado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Valor en Libros
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={asset.bookValue}
                            onChange={(e) => handleAssetDataChange(asset.id, 'bookValue', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Valor Recuperable
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={asset.recoverableValue}
                            onChange={(e) => handleAssetDataChange(asset.id, 'recoverableValue', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Observaciones
                          </label>
                          <input
                            type="text"
                            value={asset.observations}
                            onChange={(e) => handleAssetDataChange(asset.id, 'observations', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Opcional..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de bienes disponibles */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">
                Bienes Disponibles
              </h4>
              {loadingBienes ? (
                <div className="text-center py-8 text-slate-500">
                  Cargando bienes...
                </div>
              ) : filteredBienes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No se encontraron bienes disponibles
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredBienes.map(bien => {
                    const isSelected = selectedAssets.find(a => a.id === bien.id);
                    const isOccupied = occupiedAssetIds.includes(bien.id);

                    return (
                      <div
                        key={bien.id}
                        onClick={() => !isOccupied && handleAssetSelect(bien)}
                        className={`p-3 rounded-lg border-2 transition ${isOccupied
                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'border-blue-500 bg-blue-50 cursor-pointer shadow-sm'
                              : 'border-slate-200 hover:border-blue-300 bg-white cursor-pointer'
                          }`}
                        title={isOccupied ? "Este bien ya se encuentra en otro expediente de baja activo" : ""}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold text-sm ${isOccupied ? 'text-gray-500' : 'text-slate-800'}`}>
                                {bien.assetCode || bien.codigoPatrimonial}
                              </p>
                              {isOccupied && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold rounded uppercase tracking-wider">
                                  En uso
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {bien.description || bien.descripcion}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Valor: S/ {(bien.currentValue || bien.valorActual || bien.acquisitionValue || bien.valorAdquisicion || 0).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            {isSelected && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t">
            <p className="text-sm text-slate-600">
              {selectedAssets.length} bien(es) seleccionado(s)
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || selectedAssets.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Agregando...' : `Agregar ${selectedAssets.length} Bien(es)`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
