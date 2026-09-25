import React from 'react';
import { createProveedor, updateProveedor } from '../../services/api';
import { useSupplierForm } from './useSupplierForm';
import SupplierBasicInfoSection from './form-sections/SupplierBasicInfoSection';
import SupplierContactSection from './form-sections/SupplierContactSection';
import SupplierTaxSection from './form-sections/SupplierTaxSection';
export default function SupplierModal({ isOpen, onClose, onSuccess, proveedor = null }) {
  const isEditing = !!proveedor;
  const {
    formData, loading, error, setError, errors, tiposDocumento,
    checkingDocument, showConfirmation, setShowConfirmation,
    handleChange, handleBlur, handleSubmit,
  } = useSupplierForm({ isOpen, proveedor });
  const handleConfirmSave = async () => {
    setShowConfirmation(false);
    try {
      const payload = {
        documentTypesId: Number(formData.documentTypesId),
        numeroDocumento: formData.numeroDocumento,
        legalName: formData.legalName,
        tradeName: formData.tradeName || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        mainContact: formData.mainContact || null,
        companyType: formData.companyType || null,
        isStateProvider: Boolean(formData.isStateProvider),
        classification: formData.classification || null,
      };
      if (isEditing) await updateProveedor(proveedor.id, payload);
      else await createProveedor(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el proveedor');
    }
  };
  if (!isOpen) return null;
  const spinnerSvg = (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          {}
          <div className="px-6 py-5 shadow-lg" style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {}
          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            <SupplierBasicInfoSection
              formData={formData}
              errors={errors}
              tiposDocumento={tiposDocumento}
              checkingDocument={checkingDocument}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <SupplierContactSection
              formData={formData}
              errors={errors}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <SupplierTaxSection
              formData={formData}
              errors={errors}
              onChange={handleChange}
            />
          </form>
          {}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 flex justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-slate-300 bg-white rounded-xl text-slate-700 hover:border-slate-400 font-semibold transition-all shadow-sm hover:shadow"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}
            >
              {loading ? <>{spinnerSvg} Guardando...</> : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {}
      {showConfirmation && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={() => setShowConfirmation(false)} />
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              <div className="px-6 py-5 shadow-lg" style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Confirmar Registro</h3>
                </div>
              </div>
              <div className="px-6 py-6 bg-white">
                <p className="text-lg text-slate-700 mb-5">
                  ¿Está seguro que desea {isEditing ? 'actualizar' : 'guardar'} la información del proveedor?
                </p>
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-600">Razón Social:</span>
                    <span className="text-sm font-semibold text-slate-800 text-right">{formData.legalName}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-600">Documento:</span>
                    <span className="text-sm font-semibold text-slate-800">{formData.numeroDocumento}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-600">Email:</span>
                    <span className="text-sm font-semibold text-slate-800 text-right break-all">{formData.email}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-2.5 border-2 border-slate-300 bg-white rounded-xl text-slate-700 hover:border-slate-400 font-semibold transition-all shadow-sm hover:shadow"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={loading}
                  className="px-8 py-2.5 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}
                >
                  {loading ? <>{spinnerSvg} Guardando...</> : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sí, {isEditing ? 'Actualizar' : 'Guardar'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
