import React, { useState, useEffect } from 'react';
import { downloadBatchTemplate, uploadBatchCsv, getSbnCatalog } from '../../services/api';
import useConfigurationData from '../../hooks/useConfigurationData';
import SelectSearch from '../shared/SelectSearch';

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const configData = useConfigurationData();
  const { categories, reload: reloadConfig } = configData;

  const [grupoSel, setGrupoSel] = useState('');
  const [sbnCode, setSbnCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [acqType, setAcqType] = useState('COMPRA');
  const [currency, setCurrency] = useState('PEN');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sbnData, setSbnData] = useState([]);
  const [sbnGrupos, setSbnGrupos] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    reloadConfig();
    setResult(null);
    setError('');
    setFile(null);
    setGrupoSel('');
    setSbnCode('');
    setCategoryId('');
    getSbnCatalog().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setSbnData(data);
        setSbnGrupos([...new Set(data.map(d => d.grupo))]);
      }
    }).catch(() => {
      setError('Error al cargar catálogo SBN desde el servidor');
    });
  }, [isOpen]);

  const handleGrupoChange = (e) => {
    setGrupoSel(e.target.value);
    setSbnCode('');
  };

  const handleSbnCodeChange = (e) => {
    setSbnCode(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategoryId(e.target.value);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadBatchTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla-carga-masiva.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Error al descargar la plantilla');
    }
  };

  const handleUpload = async () => {
    if (!sbnCode || !categoryId || !file) {
      setError('Selecciona SBN, categoría y archivo CSV');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sbnCode', sbnCode);
      fd.append('categoryId', categoryId);
      fd.append('acquisitionType', acqType);
      fd.append('currency', currency);
      const res = await uploadBatchCsv(fd);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sbnGrupoOptions = sbnGrupos.map(g => ({ id: g, label: g }));
  const sbnCodeOptions = grupoSel
    ? sbnData.filter(d => d.grupo === grupoSel).map(item => ({
        ...item,
        label: `${item.codigo} — ${item.descripcion}`
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Carga Masiva de Bienes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
          )}

          {result ? (
            <div>
              <div className="flex gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg px-5 py-3 text-center flex-1">
                  <p className="text-2xl font-bold text-blue-700">{result.total || 0}</p>
                  <p className="text-sm text-blue-600">Total Procesado</p>
                </div>
                <div className="bg-green-50 rounded-lg px-5 py-3 text-center flex-1">
                  <p className="text-2xl font-bold text-green-700">{result.created || 0}</p>
                  <p className="text-sm text-green-600">Creados</p>
                </div>
                <div className="bg-red-50 rounded-lg px-5 py-3 text-center flex-1">
                  <p className="text-2xl font-bold text-red-700">{(result.errors || []).length}</p>
                  <p className="text-sm text-red-600">Errores</p>
                </div>
              </div>
              {(result.errors || []).length > 0 && (
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Fila</th>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Código</th>
                        <th className="px-4 py-2 text-left text-gray-600 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">{e.row || '-'}</td>
                          <td className="px-4 py-2 text-gray-600">{e.code || '-'}</td>
                          <td className="px-4 py-2 text-red-600">{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setResult(null); setFile(null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  Cargar otro archivo
                </button>
                <button onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">1. Clasificación SBN</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SelectSearch
                    label="Grupo SBN"
                    name="sbnGrupo"
                    value={grupoSel}
                    onChange={handleGrupoChange}
                    options={sbnGrupoOptions}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar grupo..."
                    emptyOption="-- Seleccione grupo --"
                    required
                  />
                  <div>
                    <SelectSearch
                      label="Bien según catálogo SBN"
                      name="sbnCode"
                      value={sbnCode}
                      onChange={handleSbnCodeChange}
                      options={sbnCodeOptions}
                      valueKey="codigo"
                      labelKey="label"
                      placeholder="Buscar bien SBN..."
                      emptyOption="-- Seleccione bien SBN --"
                      disabled={!grupoSel}
                      required
                    />
                    {!grupoSel && (
                      <p className="mt-1 text-xs text-slate-400">Seleccione un grupo primero</p>
                    )}
                  </div>
                  <SelectSearch
                    label="Categoría"
                    name="categoryId"
                    value={categoryId}
                    onChange={handleCategoryChange}
                    options={categories}
                    valueKey="id"
                    labelKey="label"
                    placeholder="Buscar categoría..."
                    emptyOption="-- Seleccione categoría --"
                    required
                  />
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">2. Parámetros</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Adquisición</label>
                    <select value={acqType} onChange={e => setAcqType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="COMPRA">Compra</option>
                      <option value="DONACION">Donación</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="ASIGNACION">Asignación</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                    <select value={currency} onChange={e => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">3. Archivo CSV</h3>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 border border-gray-300 text-xs">
                    Descargar Plantilla
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])}
                    className="hidden" id="bulk-csv-upload" />
                  <label htmlFor="bulk-csv-upload" className="cursor-pointer block">
                    {file ? (
                      <p className="text-blue-600 font-medium text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                    ) : (
                      <>
                        <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-500 text-sm mt-2">Haz clic para seleccionar archivo CSV</p>
                        <p className="text-xs text-gray-400 mt-1">Solo .csv</p>
                      </>
                    )}
                  </label>
                </div>
              </section>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleUpload} disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  {loading ? 'Subiendo...' : 'Subir y Procesar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
