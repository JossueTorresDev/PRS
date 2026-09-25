import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ClockIcon, InformationCircleIcon, DocumentIcon, UserIcon, ArrowsUpDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { MovementStatusConfig, MovementTypeLabels, formatDate, calculateDuration, getMovementStartDate, getMovementEndDate } from '../../types/movementTypes';
import { useAssetHistoryView } from '../../hooks/useAssetHistoryView';
import MovementsList from './MovementsList';
import { pdf } from '@react-pdf/renderer';
import AssetHistoryReport, { buildAssetHistoryReportTitle } from '../../reports/AssetHistoryReport';
import { openPdfInBrowser } from '../../utils/openPdfReport';

const C = {
  navy: '#0f2744',
  navyMid: '#1a3a5c',
  accent: '#1a56db',
};

export default function AssetHistoryModal({ open, assetId, onClose, municipalityLogo = null, municipalityName = '' }) {
  const [historyTab, setHistoryTab] = useState('movimientos');
  const [historyPdfLoading, setHistoryPdfLoading] = useState(false);
  const {
    assetName, assetMovements, loading, historyMapsReady,
    persons, users, areas, locations, movementReceipts,
  } = useAssetHistoryView(assetId, open);

  const handleClose = () => {
    setHistoryTab('movimientos');
    onClose?.();
  };

  const handleDownloadHistoryPdf = async () => {
    if (historyPdfLoading || !historyMapsReady || loading || !assetId) return;
    setHistoryPdfLoading(true);
    try {
      const blob = await pdf(
        <AssetHistoryReport
          assetName={assetName}
          assetCode={assetId}
          assetId={assetId}
          movements={assetMovements}
          persons={persons}
          users={users}
          areas={areas}
          locations={locations}
          municipalityLogo={municipalityLogo}
          municipalityName={municipalityName}
          officeName="Gerencia Municipal"
        />
      ).toBlob();
      openPdfInBrowser(blob, buildAssetHistoryReportTitle(assetName));
    } catch (err) {
      console.error('Error generando PDF de historial:', err);
    } finally {
      setHistoryPdfLoading(false);
    }
  };

  if (!open) return null;

  return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>

            {/* Header historial */}
            <div className="flex-shrink-0 px-7 py-5 flex justify-between items-center" style={{ backgroundColor: '#283447' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Trazabilidad del Activo</p>
                  <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{assetName || assetId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadHistoryPdf}
                  disabled={historyPdfLoading || loading || !historyMapsReady}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold rounded-lg border-2 transition-all duration-150 disabled:opacity-50 hover:scale-105 hover:shadow-lg bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                >
                  <DocumentIcon className="h-4 w-4" />
                  {historyPdfLoading || loading || !historyMapsReady
                    ? 'Preparando...'
                    : 'Descargar Historial'}
                </button>
                {/* Botón Cerrar */}
                <button onClick={() => { handleClose(); }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <XMarkIcon className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Pestañas */}
            <div className="flex border-b px-7 flex-shrink-0" style={{ backgroundColor: C.navyMid, borderColor: 'rgba(255,255,255,0.1)' }}>
              {[
                { key: 'movimientos', label: <span className="flex items-center gap-1.5"><ArrowsUpDownIcon className="h-3.5 w-3.5" />Movimientos</span> },
                { key: 'custodia', label: <span className="flex items-center gap-1.5"><span>🏛️</span>Cadena de Custodia SBN</span> },
              ].map(tab => (
                <button key={tab.key} onClick={() => setHistoryTab(tab.key)}
                  className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${historyTab === tab.key ? 'border-white text-white' : 'border-transparent text-blue-300 hover:text-white'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/80" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="flex flex-col justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4" style={{ borderColor: `${C.accent} transparent transparent transparent` }}></div>
                  <p className="mt-4 text-gray-500 font-medium">Cargando historial...</p>
                </div>
              ) : assetMovements.length === 0 ? (
                <div className="text-center py-16">
                  <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-gray-500">No hay movimientos registrados</h3>
                </div>
              ) : historyTab === 'movimientos' ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl" style={{ backgroundColor: '#f0f4ff', border: `1px solid ${C.accent}30` }}>
                    <ArrowsUpDownIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: C.accent }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.navy }}>Historial de Movimientos del Activo</p>
                      <p className="text-xs text-gray-500 mt-0.5">Registro cronológico de todos los movimientos registrados para este bien patrimonial.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[...assetMovements].sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0)).map((mov) => {
                      const chronoArr = [...assetMovements].sort((a, b) => new Date(a.requestDate || 0) - new Date(b.requestDate || 0));
                      const chronoIdx = chronoArr.findIndex(m => m.id === mov.id);
                      const nextMov = chronoIdx < chronoArr.length - 1 ? chronoArr[chronoIdx + 1] : null;
                      const startDate = getMovementStartDate(mov);
                      const endDate = getMovementEndDate(mov, nextMov);
                      const duration = calculateDuration(startDate, endDate);
                      const sc = MovementStatusConfig[mov.movementStatus] || MovementStatusConfig.REQUESTED;
                      
                      // Estilos del badge de tipo de movimiento
                      const getMovementTypeBadgeStyle = (movementType) => {
                        const styles = {
                          'INITIAL_ASSIGNMENT': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                          'REASSIGNMENT': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                          'AREA_TRANSFER': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                          'EXTERNAL_TRANSFER': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
                          'RETURN': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
                          'LOAN': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                          'MAINTENANCE': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                          'REPAIR': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                          'DISPOSAL': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
                        };
                        return styles[movementType] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
                      };
                      
                      return (
                        <div key={mov.id} className="relative pl-9 pb-5 last:pb-0" style={{ borderLeft: `2px solid #dde3f0` }}>
                          <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm ${sc.bgColor}`}></div>
                          <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300" style={{ border: '1px solid #e8edf5' }}>
                            <div className="flex items-start justify-between mb-3">
                              {/* Tipo de movimiento con color */}
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getMovementTypeBadgeStyle(mov.movementType).bg} ${getMovementTypeBadgeStyle(mov.movementType).text} ${getMovementTypeBadgeStyle(mov.movementType).border}`}>
                                {MovementTypeLabels[mov.movementType] || mov.movementType}
                              </span>
                              {/* Estado y número en columna */}
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${sc.color}`}>{sc.label}</span>
                                <span className="text-xs text-gray-400 font-mono">#{mov.movementNumber}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {mov.destinationAreaId && <div><span className="text-gray-400 text-xs">Área destino: </span><span className="font-semibold text-gray-700">{areas[mov.destinationAreaId] || mov.destinationAreaId}</span></div>}
                              {mov.destinationResponsibleId && <div><span className="text-gray-400 text-xs">Responsable: </span><span className="font-semibold text-gray-700">{persons[mov.destinationResponsibleId] || mov.destinationResponsibleId}</span></div>}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-xs">
                              <div><span className="text-gray-400">Desde: </span><span className="font-semibold text-gray-700">{startDate ? formatDate(startDate) : '—'}</span></div>
                              <div><span className="text-gray-400">Hasta: </span><span className="font-semibold text-gray-700">{endDate ? formatDate(endDate) : '—'}</span></div>
                              <div><span className="text-gray-400">Duración: </span><span className="font-bold" style={{ color: C.accent }}>{duration.description}</span></div>
                            </div>
                            {mov.reason && <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500"><span className="font-semibold text-gray-600">Motivo: </span>{mov.reason}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: C.navy }}>Lista Completa de Movimientos</h3>
                    <MovementsList movements={assetMovements} loading={false} error={null} onView={null} onEdit={null} onDelete={null} onRestore={null} />
                  </div>
                </div>
              ) : (
                /* ── Cadena de Custodia SBN ── */
                (() => {
                  const completados = [...assetMovements]
                    .filter(m => m.movementStatus === 'COMPLETED')
                    .sort((a, b) => new Date(b.approvalDate || b.updatedAt || b.createdAt || 0) - new Date(a.approvalDate || a.updatedAt || a.createdAt || 0));
                  const cronologico = [...completados].reverse();
                  const calcularTiempoEnCustodia = (movActual, movSiguiente) => {
                    const inicio = new Date(movActual.approvalDate || movActual.executionDate || movActual.updatedAt || movActual.createdAt);
                    const fin = movSiguiente ? new Date(movSiguiente.approvalDate || movSiguiente.executionDate || movSiguiente.updatedAt || movSiguiente.createdAt) : new Date();
                    const diffMs = fin - inicio;
                    if (diffMs <= 0) return null;
                    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    if (dias > 0) return `${dias} día${dias !== 1 ? 's' : ''}${horas > 0 ? ` ${horas}h` : ''}`;
                    if (horas > 0) return `${horas} hora${horas !== 1 ? 's' : ''}${minutos > 0 ? ` ${minutos}min` : ''}`;
                    return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
                  };

                  if (completados.length === 0) return (
                    <div className="text-center py-16">
                      <span className="text-5xl mb-4 block">🏛️</span>
                      <h3 className="text-base font-semibold text-gray-500 mb-1">Sin cambios de custodia registrados</h3>
                      <p className="text-xs text-gray-400">Solo se muestran movimientos con estado COMPLETADO</p>
                    </div>
                  );
                  return (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6" style={{ backgroundColor: '#f0f4ff', border: `1px solid ${C.accent}30` }}>
                        <span className="text-xl mt-0.5">🏛️</span>
                        <div>
                          <p className="text-sm font-bold" style={{ color: C.navy }}>Cadena de Custodia — Normativa SBN</p>
                          <p className="text-xs text-gray-500 mt-0.5">Registro de cambios de custodio conforme a la Directiva N° 001-2015/SBN. Solo movimientos completados.</p>
                        </div>
                      </div>
                      {completados.map((mov, idx) => {
                        const fechaEfectiva = mov.approvalDate || mov.executionDate || mov.updatedAt;
                        const custodioAnterior = mov.originResponsibleId ? (persons[mov.originResponsibleId] || mov.originResponsibleId) : '—';
                        const custodioNuevo = mov.destinationResponsibleId ? (persons[mov.destinationResponsibleId] || mov.destinationResponsibleId) : '—';
                        const aprobadoPor = mov.approvedBy ? (users[mov.approvedBy] || mov.approvedBy) : '—';
                        const areaOrigen = mov.originAreaId ? (areas[mov.originAreaId] || mov.originAreaId) : '—';
                        const areaDestino = mov.destinationAreaId ? (areas[mov.destinationAreaId] || mov.destinationAreaId) : '—';
                        const ubicOrigen = mov.originLocationId ? (locations[mov.originLocationId] || null) : null;
                        const ubicDestino = mov.destinationLocationId ? (locations[mov.destinationLocationId] || null) : null;
                        
                        // Plan de contingencia: generar número de acta de respaldo si no existe
                        const generarActaRespaldo = (movimiento) => {
                          const fecha = movimiento.approvalDate || movimiento.executionDate || movimiento.updatedAt || movimiento.createdAt;
                          const year = fecha ? new Date(fecha).getFullYear() : new Date().getFullYear();
                          const month = fecha ? String(new Date(fecha).getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
                          const movNum = movimiento.movementNumber?.replace(/[^0-9]/g, '') || movimiento.id?.toString().slice(-6) || '000000';
                          return `ACTA-${year}-${month}-${movNum}`;
                        };
                        
                        const acta = movementReceipts[mov.id] || mov.supportingDocumentNumber || generarActaRespaldo(mov);
                        const tipoDoc = mov.supportingDocumentType || (movementReceipts[mov.id] ? 'Acta de Entrega' : 'Acta de Custodia');
                        const cronIdx = cronologico.findIndex(m => m.id === mov.id);
                        const movSiguiente = cronologico[cronIdx + 1] || null;
                        const tiempoCustodia = calcularTiempoEnCustodia(mov, movSiguiente);
                        const esUltimo = idx === 0;
                        return (
                          <div key={mov.id} className="relative pl-9 pb-5 last:pb-0" style={{ borderLeft: `2px solid #dde3f0` }}>
                            <div className="absolute -left-3 top-0 w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: C.accent }}>
                              {completados.length - idx}
                            </div>
                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden" style={{ border: '1px solid #e8edf5' }}>
                              {/* Encabezado de card */}
                              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ backgroundColor: '#e8f0fe' }}>
                                <div className="flex items-center gap-2">
                                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completado</span>
                                  <span className="text-gray-300">·</span>
                                  <span className="text-xs font-semibold text-gray-600">{MovementTypeLabels[mov.movementType] || mov.movementType}</span>
                                </div>
                                <span className="text-[11px] text-gray-400">{fechaEfectiva ? formatDate(fechaEfectiva) : '—'}</span>
                              </div>
                              <div className="p-5 space-y-3">
                                {/* Acta */}
                                <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: '#f9f9fb', border: '1px solid #e8edf5' }}>
                                  <DocumentIcon className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-400 font-semibold">N° Acta:</span>
                                  <span className="font-bold text-gray-700">{acta}</span>
                                  {tipoDoc && <><span className="text-gray-300">|</span><span className="text-gray-400 font-semibold">Tipo:</span><span className="font-bold text-gray-700">{tipoDoc}</span></>}
                                </div>
                                {/* Tiempo en custodia */}
                                {tiempoCustodia && (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: esUltimo ? '#f0f4ff' : '#f9f9fb', border: `1px solid ${esUltimo ? C.accent + '30' : '#e8edf5'}` }}>
                                    <ClockIcon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.accent }} />
                                    <span className="text-gray-500">{esUltimo ? 'Tiempo actual en custodia:' : 'Tiempo en custodia:'}</span>
                                    <span className="font-bold" style={{ color: C.navy }}>{tiempoCustodia}</span>
                                    {esUltimo && <span className="italic" style={{ color: C.accent }}>(en curso)</span>}
                                  </div>
                                )}
                                {/* Cambio de custodio */}
                                <div className="grid grid-cols-3 gap-3 items-stretch">
                                  <div className="rounded-lg p-3" style={{ backgroundColor: '#fff8f8', border: '1px solid #fde8e8' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1.5">Custodio Anterior</p>
                                    <p className="text-sm font-bold text-gray-800">{custodioAnterior}</p>
                                    {areaOrigen !== '—' && <p className="text-xs text-gray-500 mt-1">{areaOrigen}</p>}
                                    {ubicOrigen && <p className="text-[11px] text-gray-400 mt-0.5">{ubicOrigen}</p>}
                                  </div>
                                  <div className="flex justify-center items-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="h-px w-8" style={{ backgroundColor: `${C.accent}40` }}></div>
                                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.accent}12`, border: `1px solid ${C.accent}30` }}>
                                        <ArrowRightIcon className="h-4 w-4" style={{ color: C.accent }} />
                                      </div>
                                      <div className="h-px w-8" style={{ backgroundColor: `${C.accent}40` }}></div>
                                    </div>
                                  </div>
                                  <div className="rounded-lg p-3" style={{ backgroundColor: '#f0fdf4', border: '1px solid #d1fae5' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Nuevo Custodio</p>
                                    <p className="text-sm font-bold text-gray-800">{custodioNuevo}</p>
                                    {areaDestino !== '—' && <p className="text-xs text-gray-500 mt-1">{areaDestino}</p>}
                                    {ubicDestino && <p className="text-[11px] text-gray-400 mt-0.5">{ubicDestino}</p>}
                                  </div>
                                </div>
                                {/* Aprobación y motivo */}
                                <div className="flex flex-wrap gap-4 px-3 py-2.5 rounded-lg text-xs" style={{ backgroundColor: '#f9f9fb', border: '1px solid #e8edf5' }}>
                                  <div className="flex items-center gap-1.5">
                                    <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-gray-400 font-semibold">Aprobado por:</span>
                                    <span className="font-bold text-gray-700">{aprobadoPor}</span>
                                  </div>
                                  {mov.reason && (
                                    <div className="flex items-center gap-1.5">
                                      <InformationCircleIcon className="h-3.5 w-3.5 text-gray-400" />
                                      <span className="text-gray-400 font-semibold">Motivo:</span>
                                      <span className="text-gray-600">{mov.reason}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex-shrink-0 px-7 py-4 flex justify-end items-center bg-white border-t border-gray-100">
              <button onClick={handleClose}
                className="px-6 py-2.5 text-sm font-semibold rounded-lg border transition-all text-gray-600 bg-white hover:bg-gray-50 border-gray-200">
                Cerrar
              </button>
            </div>
          </div>
        </div>
  );
}
