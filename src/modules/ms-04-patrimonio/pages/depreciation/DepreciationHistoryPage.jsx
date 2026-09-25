import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepreciationHistoryByAsset } from "../../services/depreciationService.js";
import { getBienPatrimonialById } from "../../services/api.js";
import { pdf } from '@react-pdf/renderer';
import ReportDocument from '../../components/PatrimonioReports';
import ContentLoading from '../../../../shared/utils/ContentLoading.jsx';

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"
];

export default function DepreciationHistoryPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [assetInfo, setAssetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [info, history] = await Promise.all([
          getBienPatrimonialById(assetId),
          getDepreciationHistoryByAsset(assetId)
        ]);
        setAssetInfo(info);
        history.sort((a, b) => {
          if (a.fiscalYear !== b.fiscalYear) return a.fiscalYear - b.fiscalYear;
          return a.calculationMonth - b.calculationMonth;
        });
        setData(history);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [assetId]);

  const formatNumber = (num) =>
    num ? num.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "0.00";

  const totalDepreciado = data.length > 0
    ? data[data.length - 1].currentAccumulatedDepreciation || 0
    : 0;
  const valorActual = data.length > 0
    ? data[data.length - 1].currentBookValue || 0
    : 0;
  const valorInicial = data.length > 0
    ? data[0].initialValue || 0
    : 0;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [data.length]);

  const assetCode = assetInfo?.assetCode || assetInfo?.codigoPatrimonial || assetId;
  const assetName = assetInfo?.description || assetInfo?.descripcion || '';
  const brandModel = [assetInfo?.brand || assetInfo?.marca, assetInfo?.model || assetInfo?.modelo].filter(Boolean).join(' / ');
  const status = assetInfo?.assetStatus || assetInfo?.estadoBien;

  const statusLabel = {
    DISPONIBLE: 'Disponible', AVAILABLE: 'Disponible',
    EN_USO: 'En Uso', IN_USE: 'En Uso',
    MANTENIMIENTO: 'Mantenimiento', MAINTENANCE: 'Mantenimiento',
    BAJA: 'Baja', INACTIVE: 'Baja',
    PRESTADO: 'Prestado', LOANED: 'Prestado',
  }[status] || status || '-';

  return (
    <>
      {generatingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <svg className="w-10 h-10 animate-spin text-slate-800" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-lg font-semibold text-slate-800">Generando reporte...</p>
            <p className="text-sm text-slate-500">Esto puede tomar unos segundos</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 sm:p-6">
        {/* Header */}
        <div className="bg-slate-800 shadow-lg mb-6 sm:mb-8 rounded-2xl">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/sipreb/patrimonio/bienes')}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white hover:bg-white/30 transition-all"
                  title="Volver a bienes"
                >
                  <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Historial de Depreciación
                  </h1>
                  <p className="text-slate-200 text-xs sm:text-sm font-medium">
                    {assetCode}{assetName ? ` — ${assetName}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={async () => {
                    if (generatingPdf) return;
                    setGeneratingPdf(true);
                    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
                    try {
                      const blob = await pdf(
                        <ReportDocument type="depreciaciones" items={[{ assetId, assetCode, depreciations: data }]} meta={{ title: 'Historial de Depreciación', badge: 'DEPRECIACIONES' }} />
                      ).toBlob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `depreciacion_${assetCode || assetId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Error al generar PDF:', err);
                    } finally {
                      setGeneratingPdf(false);
                    }
                  }}
                  disabled={generatingPdf}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 disabled:opacity-50 disabled:cursor-wait text-white rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {generatingPdf ? 'Generando...' : 'Exportar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Info Cards */}
        {!loading && assetInfo && (
          <div className="mb-4 sm:mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border-l-4 border-l-slate-800 rounded-2xl p-3 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Código</p>
                <p className="text-lg sm:text-xl font-bold text-slate-800 truncate">{assetCode}</p>
              </div>
              <div className="bg-white border-l-4 border-l-blue-500 rounded-2xl p-3 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado</p>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {statusLabel}
                </span>
              </div>
              {brandModel && (
                <div className="bg-white border-l-4 border-l-slate-600 rounded-2xl p-3 sm:p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Marca / Modelo</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{brandModel}</p>
                </div>
              )}
              <div className="bg-white border-l-4 border-l-green-500 rounded-2xl p-3 sm:p-5 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Valor Inicial</p>
                <p className="text-lg sm:text-xl font-bold text-green-700">S/ {formatNumber(valorInicial)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="mb-4 sm:mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl p-3 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Registros</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-800">{data.length}</p>
              </div>
              <div className="rounded-2xl p-3 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Depreciación Acumulada</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">S/ {formatNumber(totalDepreciado)}</p>
              </div>
              <div className="rounded-2xl p-3 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Valor Actual Neto</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">S/ {formatNumber(valorActual)}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="relative min-h-[200px]">
            <ContentLoading isLoading={true} message="Cargando historial de depreciación del bien patrimonial..." />
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-2">Sin registros de depreciación</p>
            <p className="text-sm text-slate-500">Este bien no tiene depreciaciones registradas</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Año Fiscal</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Mes</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Dep. Mensual (S/)</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Dep. Acumulada (S/)</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">Valor Neto (S/)</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedData.map((dep, i) => {
                      const valorResidual = dep.residualValue ?? 1.0;
                      const valorNeto = Math.max(dep.currentBookValue, valorResidual);
                      const depAcumulada = Math.min(
                        dep.currentAccumulatedDepreciation,
                        (dep.initialValue || 0) - valorResidual
                      );
                      return (
                        <tr
                          key={dep.id || i}
                          className={`border-l-4 border-l-transparent hover:border-l-slate-700 hover:bg-slate-50 transition-all duration-200 ${
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900 text-sm">{dep.fiscalYear}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 text-sm">{monthNames[dep.calculationMonth - 1]}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm font-mono text-slate-800">{formatNumber(dep.monthlyDepreciation)}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm font-mono text-amber-700">{formatNumber(depAcumulada)}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-sm font-mono text-green-700 font-semibold">{formatNumber(valorNeto)}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              dep.calculationStatus === "CALCULATED"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {dep.calculationStatus === "CALCULATED" ? "Calculado" : dep.calculationStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{startIndex + 1}</span>
                      {' - '}
                      <span className="font-semibold text-slate-900">{Math.min(startIndex + itemsPerPage, data.length)}</span>
                      {' de '}
                      <span className="font-semibold text-slate-900">{data.length}</span>
                      {' registros'}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center gap-1">
                            {idx > 0 && p - arr[idx - 1] > 1 && <span className="text-slate-400 text-xs sm:text-sm">...</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                                currentPage === p ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          currentPage === totalPages ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
