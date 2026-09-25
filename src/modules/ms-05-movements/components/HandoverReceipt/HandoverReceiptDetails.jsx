import { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import {
  UserCircleIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import handoverReceiptService from '../../services/handoverReceiptService';
import { MovementTypeLabels } from '../../types/movementTypes';
import {
  enrichReceiptAssets,
  receiptAssetsNeedEnrichment,
} from '../../utils/handoverReceiptAssetResolver';

const statusConfig = {
  GENERATED: {
    label: 'Generado',
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    icon: DocumentTextIcon, dot: 'bg-blue-500'
  },
  PARTIALLY_SIGNED: {
    label: 'Parcialmente Firmado',
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    icon: ClockIcon, dot: 'bg-blue-500'
  },
  FULLY_SIGNED: {
    label: 'Completamente Firmado',
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    icon: CheckCircleIcon, dot: 'bg-blue-500'
  },
  VOIDED: {
    label: 'No Vigente',
    bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
    icon: XCircleIcon, dot: 'bg-blue-500'
  }
};

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
    <div className="bg-white/20 p-2 rounded-xl">
      <Icon className="h-5 w-5 text-white" />
    </div>
    <h4 className="text-base font-bold text-white uppercase tracking-wider">{title}</h4>
  </div>
);

export default function HandoverReceiptDetails({
  receiptId,
  municipalityId,
  users = [],
  persons = [],
  movements = [],
  assets = [],
  onClose,
  onEdit,
  onSign
}) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPersonNameById = (personId) => {
    if (!personId) return 'No asignado';

    const person = (persons || []).find(p => 
      p.id === personId || p.personId === personId || p.uuid === personId
    );
    if (person) {
      const firstName = person.firstName || person.first_name || '';
      const middleName = person.middleName || person.middle_name || '';
      const lastName = person.lastName || person.last_name || '';
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const personType = person.personType || person.person_type;
      if (personType === 'J' || personType === 'JURIDICA') {
        return person.businessName || person.business_name || fullName || 'Persona Jurídica';
      }
      return fullName || 'Sin nombre';
    }

    const user = (users || []).find(u => 
      u.id === personId || u.personId === personId || u.userId === personId
    );
    if (user) return user.username || 'Usuario sin nombre';

    return 'No asignado';
  };

  const getMovementInfo = (movementId) => {
    if (!movementId) return 'N/A';
    const movement = movements.find(m => m.id === movementId);
    if (movement) {
      const typeLabel = MovementTypeLabels[movement.movementType] || movement.movementType || 'Sin tipo';
      return `${movement.movementNumber} - ${typeLabel}`;
    }
    return movementId.slice(-8);
  };

  useEffect(() => {
    if (receiptId && municipalityId) loadReceiptDetails();
  }, [receiptId, municipalityId, assets]);

  const loadReceiptDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await handoverReceiptService.getHandoverReceiptById(receiptId);
      const movement = movements.find(
        (item) => String(item.id) === String(data.movementId)
      );
      const enriched = await enrichReceiptAssets(data, assets, {
        movement,
        movements,
      });
      setReceipt(enriched);

      if (
        receiptAssetsNeedEnrichment(data?.assets || [])
        && !receiptAssetsNeedEnrichment(enriched?.assets || [])
      ) {
        handoverReceiptService.updateHandoverReceipt(enriched.id, {
          movementId: enriched.movementId,
          assets: enriched.assets,
        }).catch(() => {});
      }
    } catch (err) {
      setError('Error al cargar los detalles del acta');
      console.error('Error loading receipt details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('es-ES');
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.GENERATED;
    const IconComponent = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
        <IconComponent className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-slate-600 font-medium">Cargando detalles del acta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Error</h3>
            <button onClick={onClose} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg p-1 transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={loadReceiptDetails} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const totalAssetUnits = (receipt.assets || []).reduce(
    (sum, asset) => sum + (parseInt(asset.quantity, 10) || 1),
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden">

        {/* Header principal */}
        <div className="bg-blue-600 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Acta de Entrega-Recepción</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold">#{receipt.receiptNumber}</span>
                  </div>
                  <div className="bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-xs text-blue-100">ID: {receipt.id.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-all hover:rotate-90"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* Columna principal */}
            <div className="xl:col-span-3 space-y-6">

              {/* Información General */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Información General" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número de Acta</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="font-semibold text-slate-900">{receipt.receiptNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${statusConfig[receipt.receiptStatus]?.bg || 'bg-blue-100'} ${statusConfig[receipt.receiptStatus]?.border || 'border-blue-200'}`}>
                        {(() => { const Ic = statusConfig[receipt.receiptStatus]?.icon || DocumentTextIcon; return <Ic className={`h-4 w-4 ${statusConfig[receipt.receiptStatus]?.text || 'text-blue-600'}`} />; })()}
                      </div>
                      <p className="font-semibold text-slate-900">
                        {statusConfig[receipt.receiptStatus]?.label || 'Generado'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha del Acta</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="font-semibold text-slate-900">{formatDate(receipt.receiptDate)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Movimiento</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <EyeIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="font-semibold text-slate-900">{receipt.movementNumber || getMovementInfo(receipt.movementId)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participantes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={UserIcon} title="Participantes" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Responsable de Entrega', id: receipt.deliveringResponsibleId, sub: 'Entrega' },
                    { label: 'Responsable de Recepción', id: receipt.receivingResponsibleId, sub: 'Recepción' },
                    { label: 'Testigo 1', id: receipt.witness1Id, sub: 'Testigo' },
                    { label: 'Testigo 2', id: receipt.witness2Id, sub: 'Testigo' },
                  ].map(({ label, id, sub }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{label}</label>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 hover:border-blue-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <UserIconSolid className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{getPersonNameById(id)}</p>
                          <p className="text-xs text-slate-500">{sub}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bienes Patrimoniales */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={CubeIcon} title="Bienes Patrimoniales" />
                <div className="p-6">
                  {receipt.assets && receipt.assets.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead className="bg-indigo-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-indigo-700">Código</th>
                              <th className="px-4 py-3 text-left font-semibold text-indigo-700">Descripción</th>
                              <th className="px-4 py-3 text-center font-semibold text-indigo-700">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {receipt.assets.map((asset, idx) => (
                              <tr key={`${asset.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-mono text-indigo-700 font-semibold">{asset.assetCode}</td>
                                <td className="px-4 py-3 text-gray-700">{asset.assetDescription || asset.description || asset.descripcion || '—'}</td>
                                <td className="px-4 py-3 text-center font-semibold text-gray-700">{asset.quantity || 1}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr>
                              <td colSpan="2" className="px-4 py-3 font-semibold text-gray-700">Total</td>
                              <td className="px-4 py-3 text-center font-bold text-indigo-700">
                                {totalAssetUnits} unidad{totalAssetUnits !== 1 ? 'es' : ''}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">No hay bienes registrados</p>
                      <p className="text-gray-400 text-sm">Los bienes se cargarán cuando se actualice el acta</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={DocumentTextIcon} title="Observaciones" />
                <div className="p-6 space-y-5">
                  {[
                    { label: 'Observaciones de Entrega', value: receipt.deliveryObservations, icon: DocumentArrowDownIcon },
                    { label: 'Observaciones de Recepción', value: receipt.receptionObservations, icon: DocumentTextIcon },
                    { label: 'Condiciones Especiales', value: receipt.specialConditions, icon: InformationCircleIcon },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        {label}
                      </label>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[72px]">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {value || <span className="text-slate-400 italic">Sin observaciones</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna lateral */}
            <div className="xl:col-span-1 space-y-6">

              {/* Estado de Firmas */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={ShieldCheckIcon} title="Firmas" />
                <div className="p-5 space-y-4">
                  {[
                    { label: 'Firma de Entrega', date: receipt.deliverySignatureDate },
                    { label: 'Firma de Recepción', date: receipt.receptionSignatureDate },
                  ].map(({ label, date }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
                      <div className={`p-3.5 rounded-xl border transition-all ${date ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 border-dashed'}`}>
                        <div className="flex items-center gap-3">
                          {date ? (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                                <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-blue-700">Firmado</p>
                                <p className="text-xs text-slate-500">{formatDateTime(date)}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500">Pendiente</p>
                                <p className="text-xs text-gray-400">Esperando firma...</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documento PDF */}
              {receipt.pdfDocumentPath && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <SectionHeader icon={DocumentArrowDownIcon} title="Documento" />
                  <div className="p-5">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all">
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Descargar PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Auditoría */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader icon={InformationCircleIcon} title="Auditoría" />
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generado por</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <UserCircleIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">{getPersonNameById(receipt.generatedBy)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Creación</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDateTime(receipt.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualización</label>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDateTime(receipt.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
