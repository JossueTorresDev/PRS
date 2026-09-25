import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon, ClockIcon, InformationCircleIcon, PaperClipIcon, ArrowDownTrayIcon, DocumentIcon, EyeIcon, CalendarIcon, UserIcon, TagIcon, CubeIcon } from '@heroicons/react/24/outline';
import { MovementStatusConfig, MovementTypeLabels, formatDate, getAvailableActions } from '../../types/movementTypes';
import { downloadMovementDocument } from '../../services/movementDocumentService';
import { useMovementDetails } from '../../hooks/useMovementDetails';
import authService from '../../../ms-02-authentication/services/auth.service';
import Swal from 'sweetalert2';
import AssetHistoryModal from './AssetHistoryModal';

function getCurrentUserId() {
  const u = authService.getCurrentUser();
  if (u?.userId || u?.id) return u.userId || u.id;
  try { const s = JSON.parse(sessionStorage.getItem('user') || 'null'); if (s?.userId || s?.id) return s.userId || s.id; } catch {}
  try { const t = sessionStorage.getItem('accessToken'); if (t) { const p = JSON.parse(atob(t.split('.')[1])); return p.user_id || p.sub || p.userId || p.id; } } catch {}
  return null;
}
async function confirmAction(title, html, confirmText, confirmColor) {
  return Swal.fire({ title, html, icon: 'question', showCancelButton: true, confirmButtonColor: confirmColor, cancelButtonColor: '#64748b', confirmButtonText: confirmText, cancelButtonText: 'Cancelar', reverseButtons: true });
}

// Paleta institucional
const C = {
  navy:    '#0f2744',
  navyMid: '#1a3a5c',
  navyLight:'#1e4976',
  accent:  '#1a56db',
  accentHover:'#1648c0',
  gold:    '#b8860b',
  goldLight:'#f5f0e0',
};

/** Etiquetas de campos — color distinto al valor del registro */
const FIELD_LABEL = 'text-xs font-semibold text-blue-600/85';

export default function MovementDetails({
  movementId,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onMarkInProcess,
  onComplete,
  onCancel,
  municipalityLogo = null,
  municipalityName = '',
}) {
  const [showAssetHistory, setShowAssetHistory] = useState(false);
  const [historyAssetId, setHistoryAssetId] = useState(null);
  const {
    movement, loading, error, actionLoading, persons, users, areas, locations, assetName, assetNames,
    loadingRelatedData, attachedDocuments,
    handleAction,
  } = useMovementDetails({ movementId });

  const loadAssetHistory = (assetId) => {
    if (!assetId) return;
    setHistoryAssetId(assetId);
    setShowAssetHistory(true);
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="rounded-2xl border border-slate-200/80 bg-white px-10 py-12 text-center shadow-2xl">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-700" />
        <p className="mt-5 text-sm font-medium text-slate-600">Cargando movimiento...</p>
      </div>
    </div>
  );
  if (error || !movement) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xl">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <XCircleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Error al cargar</h3>
        </div>
        <p className="mb-6 text-sm text-slate-500">{error || 'Movimiento no encontrado'}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-900"
        >
          Cerrar
        </button>
      </div>
    </div>
  );

  const statusConfig = MovementStatusConfig[movement.movementStatus] || MovementStatusConfig.REQUESTED;
  const availableActions = getAvailableActions(movement.movementStatus);

  const handleApprove = async () => {
    const userId = getCurrentUserId();
    if (!userId) { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el usuario actual.' }); return; }
    const result = await confirmAction('¿Aprobar movimiento?', `<p class="text-slate-600">Movimiento: <strong>${movement.movementNumber}</strong></p>`, 'Sí, aprobar', '#10b981');
    if (result.isConfirmed) {
      try { await handleAction(onApprove, movement.id, userId); Swal.fire({ icon: 'success', title: '¡Aprobado!', timer: 2000, timerProgressBar: true }); }
      catch (e) { Swal.fire({ icon: 'error', title: 'Error al aprobar', text: e.message }); }
    }
  };
  const handleReject = async () => {
    const userId = getCurrentUserId();
    if (!userId) { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo obtener el usuario actual.' }); return; }
    const { value: reason } = await Swal.fire({ title: 'Rechazar movimiento', html: `<p class="text-slate-600 mb-3">Movimiento: <strong>${movement.movementNumber}</strong></p><label class="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional):</label><textarea id="rejection-reason" class="swal2-textarea w-full" rows="3"></textarea>`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Sí, rechazar', cancelButtonText: 'Cancelar', reverseButtons: true, preConfirm: () => document.getElementById('rejection-reason')?.value || '' });
    if (reason !== undefined) {
      try { await handleAction(onReject, movement.id, userId, reason || null); Swal.fire({ icon: 'success', title: '¡Rechazado!', timer: 2000, timerProgressBar: true }); }
      catch (e) { Swal.fire({ icon: 'error', title: 'Error al rechazar', text: e.message }); }
    }
  };
  const handleInProcess = async () => {
    const result = await confirmAction('¿Marcar en proceso?', `<p class="text-slate-600">Movimiento: <strong>${movement.movementNumber}</strong></p>`, 'Sí, en proceso', '#3b82f6');
    if (result.isConfirmed) {
      try { await handleAction(onMarkInProcess, movement.id, getCurrentUserId()); Swal.fire({ icon: 'success', title: '¡En Proceso!', timer: 2000, timerProgressBar: true }); }
      catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: e.message }); }
    }
  };
  const handleComplete = async () => {
    const result = await confirmAction('¿Completar movimiento?', `<p class="text-slate-600">Movimiento: <strong>${movement.movementNumber}</strong></p>`, 'Sí, completar', '#10b981');
    if (result.isConfirmed) {
      try { await handleAction(onComplete, movement.id); Swal.fire({ icon: 'success', title: '¡Completado!', timer: 2000, timerProgressBar: true }); }
      catch (e) { Swal.fire({ icon: 'error', title: 'Error', text: e.message }); }
    }
  };

  const InfoField = ({ label, value, loading: l, wide, mono }) => (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p className={FIELD_LABEL}>{label}</p>
      <p className={`mt-1 text-[14px] leading-snug text-slate-800 ${mono ? 'font-mono text-[13px] text-slate-600' : 'font-medium'}`}>
        {l ? (
          <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-100" />
        ) : (
          value || <span className="font-normal text-slate-400">—</span>
        )}
      </p>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 border-b border-blue-200/70 bg-blue-50 px-6 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200/60 bg-white text-blue-700 shadow-sm">
        <Icon className="h-4 w-4 stroke-[1.75]" />
      </div>
      <div className="min-w-0 border-l-2 border-blue-300/50 pl-3">
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );

  /** Tarjeta de sección (elevación / realce) */
  const SectionCard = ({ children }) => (
    <section className="overflow-hidden rounded-2xl border border-blue-200/70 bg-white shadow-[0_4px_18px_-6px_rgba(30,58,95,0.16),0_2px_8px_-4px_rgba(30,58,95,0.08)]">
      {children}
    </section>
  );

  const InnerBox = ({ children, className = '' }) => (
    <div
      className={`rounded-xl border border-blue-200/70 bg-blue-50 p-4 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.14)] ${className}`}
    >
      {children}
    </div>
  );

  const ProseBlock = ({ label, children }) => (
    <InnerBox>
      <p className={`mb-1.5 ${FIELD_LABEL}`}>{label}</p>
      <div className="text-[13px] leading-relaxed text-slate-700">{children}</div>
    </InnerBox>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-blue-200/50 bg-white shadow-[0_25px_50px_-12px_rgba(15,39,84,0.28)]">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-blue-900/25 bg-[#1a3a5c]">
          <div className="flex items-start justify-between gap-4 px-6 py-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-600/20">
                <ArrowPathIcon className="h-5 w-5 text-blue-100" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300/90">
                  Gestión Patrimonial
                </p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">
                  Detalles del Movimiento
                </h2>
                <p
                  className="mt-1.5 inline-flex max-w-full truncate rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs font-medium text-blue-100"
                  title={movement.movementNumber}
                >
                  {movement.movementNumber}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Estado y acciones */}
        <div className="flex-shrink-0 border-b border-blue-100 bg-blue-50 px-6 py-3 sm:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className={FIELD_LABEL}>Estado</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.bgColor}`} />
                {statusConfig.label}
              </span>
            </div>
            {availableActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableActions.includes('approve') && onApprove && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    ✓ Aprobar
                  </button>
                )}
                {availableActions.includes('reject') && onReject && (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    ✕ Rechazar
                  </button>
                )}
                {availableActions.includes('in-process') && onMarkInProcess && (
                  <button
                    type="button"
                    onClick={handleInProcess}
                    disabled={actionLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    ⟳ En Proceso
                  </button>
                )}
                {availableActions.includes('complete') && onComplete && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={actionLoading}
                    className="rounded-lg bg-blue-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-900 disabled:opacity-50"
                  >
                    ✓ Completar
                  </button>
                )}
                {availableActions.includes('cancel') && onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = prompt('Motivo de cancelación (opcional):');
                      handleAction(onCancel, movement.id, r);
                    }}
                    disabled={actionLoading}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div
          className="flex-1 overflow-y-auto bg-slate-100/90"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#93c5fd transparent' }}
        >
          <div className="space-y-5 p-6 sm:p-7">

            <SectionCard>
              <SectionHeader icon={TagIcon} title="Información básica" subtitle="Identificación y clasificación del movimiento" />
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                <InfoField label="Número de movimiento" value={movement.movementNumber} mono />
                <InfoField
                  label="Tipo de movimiento"
                  value={MovementTypeLabels[movement.movementType] || movement.movementType}
                />
                {movement.movementSubtype && (
                  <InfoField label="Subtipo" value={movement.movementSubtype} />
                )}
                <div className="md:col-span-2">
                  <p className={FIELD_LABEL}>
                    {(movement.assetItems?.length || movement.assetIds?.length || 0) > 1 ? 'Bienes' : 'Activo'}
                  </p>
                  <InnerBox className="mt-2 border-l-4 border-l-blue-600 bg-blue-50/90">
                    {loadingRelatedData ? (
                      <span className="inline-block h-4 w-48 animate-pulse rounded bg-blue-100" />
                    ) : (
                      (() => {
                        const items = movement.assetItems?.length
                          ? movement.assetItems
                          : (movement.assetIds || [movement.assetId].filter(Boolean)).map((id, index) => ({
                              assetId: id,
                              quantity: 1,
                              label: assetNames?.[index] || assetName || id,
                            }));
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wide text-blue-700/80">
                                  <th className="px-3 py-2 font-semibold">Bien</th>
                                  <th className="px-3 py-2 font-semibold w-24 text-center">Cant.</th>
                                  <th className="px-3 py-2 font-semibold w-28 text-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, index) => {
                                  const id = item.assetId || item;
                                  const label = item.label || assetNames?.[index] || (id === movement.assetId ? assetName : id);
                                  return (
                                    <tr key={id || index} className="border-t border-blue-100/80">
                                      <td className="px-3 py-2.5 text-[14px] font-semibold text-blue-800">{label}</td>
                                      <td className="px-3 py-2.5 text-center font-semibold text-blue-900">{item.quantity || 1}</td>
                                      <td className="px-3 py-2.5 text-right">
                                        {id && (
                                          <button
                                            type="button"
                                            onClick={() => loadAssetHistory(id)}
                                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-600 hover:text-white"
                                          >
                                            <ClockIcon className="h-3.5 w-3.5" />
                                            Historial
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    )}
                  </InnerBox>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={CalendarIcon} title="Fechas del movimiento" subtitle="Cronología del proceso" />
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                <InfoField label="Fecha de solicitud" value={formatDate(movement.requestDate)} />
                {movement.approvalDate && (
                  <InfoField label="Fecha de aprobación" value={formatDate(movement.approvalDate)} />
                )}
                {movement.executionDate && (
                  <InfoField label="Fecha de ejecución" value={formatDate(movement.executionDate)} />
                )}
                {movement.receptionDate && (
                  <InfoField label="Fecha de recepción" value={formatDate(movement.receptionDate)} />
                )}
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={UserIcon} title="Responsables y usuarios" subtitle="Personas involucradas en el movimiento" />
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                {movement.originResponsibleId && (
                  <InfoField
                    label="Responsable origen"
                    value={loadingRelatedData ? null : persons[movement.originResponsibleId] || movement.originResponsibleId}
                    loading={loadingRelatedData}
                  />
                )}
                {movement.destinationResponsibleId && (
                  <InfoField
                    label="Responsable destino"
                    value={loadingRelatedData ? null : persons[movement.destinationResponsibleId] || movement.destinationResponsibleId}
                    loading={loadingRelatedData}
                  />
                )}
                <InfoField
                  label="Usuario solicitante"
                  value={
                    loadingRelatedData
                      ? null
                      : users[movement.requestingUser] ||
                        users[String(movement.requestingUser)] ||
                        'Usuario no disponible'
                  }
                  loading={loadingRelatedData}
                />
                {movement.executingUser && (
                  <InfoField
                    label="Usuario ejecutor"
                    value={
                      loadingRelatedData
                        ? null
                        : users[movement.executingUser] ||
                          users[String(movement.executingUser)] ||
                          'Usuario no disponible'
                    }
                    loading={loadingRelatedData}
                  />
                )}
                {movement.approvedBy && (
                  <InfoField
                    label="Aprobado por"
                    value={
                      loadingRelatedData
                        ? null
                        : users[movement.approvedBy] ||
                          users[String(movement.approvedBy)] ||
                          'Usuario no disponible'
                    }
                    loading={loadingRelatedData}
                  />
                )}
              </div>
            </SectionCard>

            {(movement.originAreaId || movement.destinationAreaId || movement.originLocationId || movement.destinationLocationId) && (
              <SectionCard>
                <SectionHeader icon={CubeIcon} title="Áreas y ubicaciones" subtitle="Origen y destino del activo" />
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                  {movement.originAreaId && (
                    <InfoField
                      label="Área origen"
                      value={loadingRelatedData ? null : areas[movement.originAreaId] || movement.originAreaId}
                      loading={loadingRelatedData}
                    />
                  )}
                  {movement.destinationAreaId && (
                    <InfoField
                      label="Área destino"
                      value={loadingRelatedData ? null : areas[movement.destinationAreaId] || movement.destinationAreaId}
                      loading={loadingRelatedData}
                    />
                  )}
                  {movement.originLocationId && (
                    <InfoField
                      label="Ubicación origen"
                      value={loadingRelatedData ? null : locations[movement.originLocationId] || movement.originLocationId}
                      loading={loadingRelatedData}
                    />
                  )}
                  {movement.destinationLocationId && (
                    <InfoField
                      label="Ubicación destino"
                      value={loadingRelatedData ? null : locations[movement.destinationLocationId] || movement.destinationLocationId}
                      loading={loadingRelatedData}
                    />
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard>
              <SectionHeader icon={InformationCircleIcon} title="Información adicional" subtitle="Motivo, observaciones y condiciones" />
              <div className="space-y-4 px-6 py-5">
                <ProseBlock label="Motivo">
                  <p className="whitespace-pre-wrap">{movement.reason}</p>
                </ProseBlock>
                {movement.observations && (
                  <ProseBlock label="Observaciones">
                    <p className="whitespace-pre-wrap">{movement.observations}</p>
                  </ProseBlock>
                )}
                {movement.specialConditions && (
                  <ProseBlock label="Condiciones especiales">
                    <p className="whitespace-pre-wrap">{movement.specialConditions}</p>
                  </ProseBlock>
                )}
              </div>
            </SectionCard>

            {(movement.supportingDocumentNumber || movement.supportingDocumentType) && (
              <SectionCard>
                <SectionHeader icon={DocumentIcon} title="Documentos de soporte" subtitle="Documentación respaldatoria" />
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                  {movement.supportingDocumentNumber && (
                    <InfoField label="Número de documento" value={movement.supportingDocumentNumber} />
                  )}
                  {movement.supportingDocumentType && (
                    <InfoField label="Tipo de documento" value={movement.supportingDocumentType} />
                  )}
                </div>
              </SectionCard>
            )}

            <SectionCard>
              <SectionHeader
                icon={PaperClipIcon}
                title={`Documentos adjuntos${attachedDocuments.length > 0 ? ` (${attachedDocuments.length})` : ''}`}
                subtitle="Archivos vinculados al movimiento"
              />
              <div className="px-6 py-5">
                {attachedDocuments.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-200/80 bg-blue-50/40 px-4 py-4">
                    <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-500/80" />
                    <p className="text-sm text-slate-500">No hay documentos adjuntos en este movimiento</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {attachedDocuments.map((doc, i) => {
                      const isPDF = doc.fileType === 'application/pdf' || doc.fileName?.toLowerCase().endsWith('.pdf');
                      return (
                        <div
                          key={i}
                          className="flex flex-col gap-3 rounded-xl border border-blue-200/60 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(37,99,235,0.1)] transition-all duration-200 hover:border-blue-300/80 hover:shadow-[0_4px_14px_-4px_rgba(37,99,235,0.18)] sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 ring-1 ring-blue-200/60">
                              <DocumentIcon className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {doc.fileName || `Documento ${i + 1}`}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                                {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(2)} KB</span>}
                                {doc.fileType && <span className="uppercase">{doc.fileType.split('/')[1]}</span>}
                                {doc.uploadedAt && <span>{formatDate(doc.uploadedAt)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {isPDF && doc.fileUrl && (
                              <button
                                type="button"
                                onClick={() => window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-900 hover:shadow-md hover:shadow-blue-400/35"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                Ver
                              </button>
                            )}
                            {doc.fileUrl && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const r = await downloadMovementDocument(doc.fileUrl, doc.fileName);
                                  if (!r.success) Swal.fire({ icon: 'error', title: 'Error', text: r.error });
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-800 shadow-sm transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md hover:shadow-blue-200/50"
                              >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                Descargar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard>
              <SectionHeader icon={CheckCircleIcon} title="Configuración y auditoría" subtitle="Trazabilidad del registro" />
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 py-5 md:grid-cols-2">
                <div>
                  <p className={FIELD_LABEL}>Requiere aprobación</p>
                  <p className="mt-1 text-[14px] font-medium">
                    {movement.requiresApproval ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <XCircleIcon className="h-3.5 w-3.5" />
                        No
                      </span>
                    )}
                  </p>
                </div>
                {movement.createdAt && (
                  <InfoField label="Fecha de creación" value={formatDate(movement.createdAt)} />
                )}
                {movement.updatedAt && (
                  <InfoField label="Última actualización" value={formatDate(movement.updatedAt)} />
                )}
              </div>
            </SectionCard>

          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end border-t border-blue-100 bg-blue-50 px-6 py-3.5 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-blue-200/80 bg-white px-5 py-2 text-[13px] font-semibold text-blue-900/80 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-200/40"
          >
            Cerrar
          </button>
        </div>
      </div>

      <AssetHistoryModal
        open={showAssetHistory}
        assetId={historyAssetId}
        onClose={() => { setShowAssetHistory(false); setHistoryAssetId(null); }}
        municipalityLogo={municipalityLogo}
        municipalityName={municipalityName}
      />
    </div>
  );
}
