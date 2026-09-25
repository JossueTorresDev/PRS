import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMovementForm } from '../../hooks/useMovementForm';
import MovementFormBasicTab from './form-tabs/MovementFormBasicTab';
import MovementFormOriginDestinationTab from './form-tabs/MovementFormOriginDestinationTab';
import MovementFormUsersTab from './form-tabs/MovementFormUsersTab';
import MovementFormDocumentationTab from './form-tabs/MovementFormDocumentationTab';
const TABS = [
  { id: 'basica', label: 'Información Básica' },
  { id: 'origen-destino', label: 'Origen y Destino' },
  { id: 'usuarios-detalles', label: 'Usuarios y Detalles' },
  { id: 'documentacion', label: 'Documentación' },
];
export default function MovementForm({ municipalityId, movement = null, onSave, onCancel, assets = [], users = [], persons = [], positions = [], areas = [], locations = [], loadingData = false }) {
  const form = useMovementForm({ municipalityId, movement, assets, users, persons, areas, locations, loadingData, onSave });
  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-100">
        {}
        <div className="px-8 py-6 border-b flex-shrink-0 flex justify-between items-center rounded-t-3xl" style={{ backgroundColor: '#283447' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{movement ? 'Editar Movimiento' : 'Nuevo Movimiento'}</h2>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {movement ? 'Modifica la información del movimiento' : 'Completa los datos para crear un nuevo movimiento'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-white hover:bg-white/20 rounded-xl p-2 transition-all">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {}
        <div className="flex-shrink-0 px-8 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">{form.formProgress.percentage}%</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{form.formProgress.completed} de {form.formProgress.total} campos completados</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-blue-500" style={{ width: `${form.formProgress.percentage}%` }} />
          </div>
        </div>
        {}
        <div className="px-8 pt-4 border-b border-gray-200 bg-white">
          <nav className="flex space-x-2 overflow-x-auto pb-2">
            {TABS.map((tab, i) => {
              const isComplete = form.isTabComplete(tab.id);
              const hasErrors = form.hasTabErrors(tab.id);
              const isActive = form.activeTab === tab.id;
              return (
                <div key={tab.id} className="flex items-center">
                  <button type="button" onClick={() => form.setActiveTab(tab.id)}
                    style={isActive ? { backgroundColor: '#334155' } : {}}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${isActive ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${hasErrors ? (isActive ? 'bg-red-200' : 'bg-red-100') : isComplete ? (isActive ? 'bg-green-200' : 'bg-green-100') : (isActive ? 'bg-gray-300' : 'bg-gray-200')}`}>
                      {hasErrors ? <span className={`text-xs font-bold ${isActive ? 'text-red-700' : 'text-red-600'}`}>!</span>
                        : isComplete ? <svg className={`w-3 h-3 ${isActive ? 'text-green-700' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-gray-500' : 'bg-gray-400'}`} />}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                  {i < TABS.length - 1 && <svg className="w-4 h-4 text-gray-300 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                </div>
              );
            })}
          </nav>
        </div>
        {}
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          <form id="movement-form" onSubmit={form.handleSubmit} className="p-6 space-y-6">
            {form.errors.submit && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800">{form.errors.submit}</p>
              </div>
            )}
            {form.activeTab === 'basica' && (
              <MovementFormBasicTab
                formData={form.formData} errors={form.errors} displayAssets={form.displayAssets}
                assetFilterMessage={form.assetFilterMessage} loadingData={loadingData} movement={movement}
                checkingActiveMovements={form.checkingActiveMovements} activeMovementWarning={form.activeMovementWarning}
                assetMovementStatus={form.assetMovementStatus} suggestedMovementType={form.suggestedMovementType}
                allowedMovementTypes={form.allowedMovementTypes} isFirstAssignment={form.isFirstAssignment}
                handleChange={form.handleChange}
                selectedAssets={form.selectedAssets}
                assetContextMap={form.assetContextMap}
                assetPickerValue={form.assetPickerValue}
                setAssetPickerValue={form.setAssetPickerValue}
                handleAddAsset={form.handleAddAsset}
                handleRemoveAsset={form.handleRemoveAsset}
                handleAssetQuantityChange={form.handleAssetQuantityChange}
                canEditAssets={form.canEditAssets} />
            )}
            {form.activeTab === 'origen-destino' && (
              <MovementFormOriginDestinationTab
                formData={form.formData} errors={form.errors} loadingData={loadingData}
                users={users} persons={persons} positions={positions} areas={areas} locations={locations}
                isFirstAssignment={form.isFirstAssignment} loadingAssetLocation={form.loadingAssetLocation}
                assetLocationLoaded={form.assetLocationLoaded} handleChange={form.handleChange} />
            )}
            {form.activeTab === 'usuarios-detalles' && (
              <MovementFormUsersTab
                formData={form.formData} errors={form.errors} loadingData={loadingData}
                users={users} persons={persons} positions={positions} areas={areas}
                movement={movement} handleChange={form.handleChange} />
            )}
            {form.activeTab === 'documentacion' && (
              <MovementFormDocumentationTab
                formData={form.formData} errors={form.errors} handleChange={form.handleChange}
                checkingDocumentDuplicate={form.checkingDocumentDuplicate}
                suggestedDocumentNumber={form.suggestedDocumentNumber}
                suggestedDocumentSource={form.suggestedDocumentSource}
                loadingSuggestedDoc={form.loadingSuggestedDoc}
                applySuggestedDocumentNumber={form.applySuggestedDocumentNumber}
                isEditing={!!movement}
                selectedFiles={form.selectedFiles} uploadedDocuments={form.uploadedDocuments}
                uploadingFiles={form.uploadingFiles} uploadError={form.uploadError} isDragging={form.isDragging}
                fileInputRef={form.fileInputRef} handleFileChange={form.handleFileChange}
                handleDragEnter={form.handleDragEnter} handleDragLeave={form.handleDragLeave}
                handleDragOver={form.handleDragOver} handleDrop={form.handleDrop}
                removeSelectedFile={form.removeSelectedFile} removeUploadedDocument={form.removeUploadedDocument}
                saving={form.saving} />
            )}
            {}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-200 -mx-6 -mb-6">
              <div className="flex justify-between items-center">
                <button type="button" onClick={onCancel} disabled={form.saving}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <div className="flex gap-3">
                  {form.activeTab !== 'basica' && (
                    <button type="button"
                      onClick={() => {
                        const idx = TABS.findIndex(t => t.id === form.activeTab);
                        if (idx > 0) form.setActiveTab(TABS[idx - 1].id);
                      }}
                      disabled={form.saving}
                      className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>
                  )}
                  {form.activeTab !== 'documentacion' ? (
                    <button type="button"
                      onClick={() => {
                        const idx = TABS.findIndex(t => t.id === form.activeTab);
                        if (idx < TABS.length - 1) form.setActiveTab(TABS[idx + 1].id);
                      }}
                      disabled={form.saving}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#283447' }}>
                      Siguiente
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button type="submit" disabled={form.saving}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#283447' }}>
                      {form.saving ? (
                        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Guardando...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{movement ? 'Actualizar Movimiento' : 'Crear Movimiento'}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
