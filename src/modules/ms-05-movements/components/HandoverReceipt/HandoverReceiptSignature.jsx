import { useState } from 'react';
import {
  XMarkIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import handoverReceiptService from '../../services/handoverReceiptService';
export default function HandoverReceiptSignature({
  receipt,
  municipalityId,
  onSigned,
  onCancel
}) {
  const [signatureData, setSignatureData] = useState({
    signatureType: '', // 'DELIVERY' or 'RECEPTION'
    observations: '',
    digitalSignature: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSignatureData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signatureData.signatureType) {
      setError('Debe seleccionar el tipo de firma');
      return;
    }
    setLoading(true);
    setError('');
    try {
  const dataToSend = {
    signatureType: signatureData.signatureType.toLowerCase(),
    signerId: receipt.deliveringResponsibleId,
    observations: signatureData.observations || null
  };
const result = await handoverReceiptService.signHandoverReceipt(receipt.id, dataToSend);
      onSigned && onSigned(result);
    } catch (err) {
      setError('Error al firmar el acta. Por favor, intente nuevamente.');
      console.error('Error signing receipt:', err);
    } finally {
      setLoading(false);
    }
  };
  const canSignDelivery = receipt.receiptStatus === 'GENERATED' ||
                         (receipt.receiptStatus === 'PARTIALLY_SIGNED' && !receipt.deliverySignatureDate);
  const canSignReception = receipt.receiptStatus === 'GENERATED' ||
                          (receipt.receiptStatus === 'PARTIALLY_SIGNED' && !receipt.receptionSignatureDate);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-white border-b-4 border-blue-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {}
              <div className="relative">
                <div className="bg-white p-3 rounded-full shadow-xl border-4 border-blue-600">
                  <svg className="h-8 w-8 text-slate-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    <path d="M12 7v10l-7-3.5V9l7-2z" fill="white"/>
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  GOB
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  ✍️ Firma Digital Oficial
                </h3>
                <p className="text-slate-200 text-sm mt-1">
                  Documento N°: {receipt.receiptNumber}
                </p>
                <p className="text-slate-300 text-xs mt-1">
                  Municipalidad Provincial • Validación de Acta Oficial
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-3 transition-colors duration-200 shadow-lg"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        {}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          {}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Tipo de Firma *</h4>
            </div>
            <div className="space-y-4">
              {canSignDelivery && (
                <div className="relative">
                  <input
                    id="delivery"
                    name="signatureType"
                    type="radio"
                    value="delivery"
                    checked={signatureData.signatureType === 'delivery'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="delivery"
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      signatureData.signatureType === 'delivery'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      signatureData.signatureType === 'delivery'
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {signatureData.signatureType === 'delivery' && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <DocumentTextIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Firma de Entrega</span>
                          <p className="text-sm text-gray-600">Confirmar la entrega de los bienes patrimoniales</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              )}
              {canSignReception && (
                <div className="relative">
                  <input
                    id="reception"
                    name="signatureType"
                    type="radio"
                    value="reception"
                    checked={signatureData.signatureType === 'reception'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="reception"
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      signatureData.signatureType === 'reception'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      signatureData.signatureType === 'reception'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {signatureData.signatureType === 'reception' && (
                        <CheckCircleIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <CheckCircleIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">Firma de Recepción</span>
                          <p className="text-sm text-gray-600">Confirmar la recepción de los bienes patrimoniales</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              )}
              {!canSignDelivery && !canSignReception && (
                <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                  <InformationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-sm text-yellow-700 font-medium">
                    No hay firmas pendientes para este acta.
                  </p>
                </div>
              )}
            </div>
          </div>
          {}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-5 w-5 text-amber-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Observaciones de la Firma</h4>
            </div>
            <textarea
              name="observations"
              value={signatureData.observations}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 resize-none"
              placeholder="Observaciones adicionales sobre la firma..."
            />
          </div>
          {}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <PencilSquareIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Firma Digital</h4>
            </div>
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors duration-200">
              <div className="bg-indigo-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <PencilSquareIcon className="h-10 w-10 text-indigo-500" />
              </div>
              <div className="mb-4">
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Área de Firma Digital
                </p>
                <p className="text-sm text-gray-500">
                  En una implementación real, aquí iría el componente de captura de firma
                </p>
              </div>
              <div className="max-w-sm mx-auto">
                <input
                  type="text"
                  name="digitalSignature"
                  value={signatureData.digitalSignature}
                  onChange={handleInputChange}
                  placeholder="Ingrese su firma digital o PIN"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>
          </div>
          {}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center mb-4">
              <InformationCircleIcon className="h-5 w-5 text-slate-600 mr-2" />
              <h4 className="text-lg font-semibold text-gray-900">Estado Actual del Acta</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Firma de Entrega</span>
                  <div className="flex items-center">
                    {receipt.deliverySignatureDate ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-semibold text-green-600">Firmado</span>
                      </>
                    ) : (
                      <>
                        <ClockIcon className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm font-semibold text-amber-600">Pendiente</span>
                      </>
                    )}
                  </div>
                </div>
                {receipt.deliverySignatureDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDateTime(receipt.deliverySignatureDate)}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Firma de Recepción</span>
                  <div className="flex items-center">
                    {receipt.receptionSignatureDate ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-semibold text-green-600">Firmado</span>
                      </>
                    ) : (
                      <>
                        <ClockIcon className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm font-semibold text-amber-600">Pendiente</span>
                      </>
                    )}
                  </div>
                </div>
                {receipt.receptionSignatureDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDateTime(receipt.receptionSignatureDate)}
                  </p>
                )}
              </div>
            </div>
          </div>
          {}
          <div className="flex justify-end space-x-6 pt-8 border-t border-gray-200 bg-gray-50 px-8 py-8 mt-8 -mx-6 -mb-6 rounded-b-2xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!canSignDelivery && !canSignReception)}
              className="px-10 py-4 border border-transparent rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-5 w-5 border-2 border-t-white"></div>
                    <div className="absolute inset-1 bg-white rounded-full opacity-20"></div>
                    <svg className="absolute inset-1.5 h-2 w-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                    </svg>
                  </div>
                  🏛️ One moment, please...
                </div>
              ) : (
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-2" />
                  Firmar Acta Oficial
                </div>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
