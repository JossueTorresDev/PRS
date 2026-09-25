import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
export default function AssetStatusSyncNotification({ 
  syncResult, 
  assetName,
  onClose 
}) {
  if (!syncResult || !syncResult.success) {
    return null;
  }
  const { assetUpdated, previousStatus, newStatus, message } = syncResult;
  if (!assetUpdated) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Movimiento completado
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {message || 'El movimiento se completó exitosamente.'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">
            Estado del activo actualizado automáticamente
          </p>
          <div className="text-sm text-green-700 mt-2 space-y-1">
            <p>
              <span className="font-medium">Activo:</span> {assetName || 'Activo'}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Estado anterior:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {previousStatus}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Estado nuevo:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                {newStatus}
              </span>
            </p>
          </div>
          <p className="text-xs text-green-600 mt-2">
            El activo ahora está {newStatus === 'DISPONIBLE' ? 'disponible para nuevas asignaciones' : 'en el estado correcto según el movimiento'}.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}