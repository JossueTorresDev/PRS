import React from 'react';
import { getCompanyTypeLabel, getClassificationLabel, getClassificationBadge } from './supplier.constants';
export default function SupplierDetailModal({ isOpen, onClose, proveedor, onEdit }) {
  if (!isOpen || !proveedor) return null;
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const getTipoDocumento = (documentTypesId) => {
    const tipos = {
      1: 'RUC',
      2: 'DNI', 
      3: 'CE',
      4: 'Pasaporte'
    };
    return tipos[documentTypesId] || 'Desconocido';
  };
  const formatDocumento = (numeroDocumento, documentTypesId) => {
    if (documentTypesId === 1 && numeroDocumento && numeroDocumento.length === 11) {
      return `${numeroDocumento.slice(0, 2)}-${numeroDocumento.slice(2, 9)}-${numeroDocumento.slice(9)}`;
    }
    return numeroDocumento || '-';
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-50"
          onClick={onClose}
        ></div>
        {}
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {}
          <div className="px-8 py-6" style={{ background: 'var(--color-sidebar-gradient-horizontal)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    Detalles del Proveedor
                  </h3>
                  <p className="text-slate-100 mt-1.5 text-base font-medium">
                    {proveedor.legalName || '-'}
                  </p>
                  <p className="text-slate-300 text-sm mt-1 font-mono">
                    {getTipoDocumento(proveedor.documentTypesId)}: {formatDocumento(proveedor.numeroDocumento, proveedor.documentTypesId)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {}
          <div className="px-8 py-8 max-h-[70vh] overflow-y-auto bg-slate-50/30">
            {}
            {proveedor.address && (
              <div className="mb-6 pb-6 border-b border-slate-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-base text-slate-700 font-medium">
                    {proveedor.address}
                  </p>
                </div>
              </div>
            )}
            {}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-slate-800 mb-5 flex items-center">
                <svg className="w-5 h-5 mr-2.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Información de Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proveedor.phone && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Teléfono
                      </label>
                    </div>
                    <p className="text-base text-slate-900 font-medium">
                      <a href={`tel:${proveedor.phone}`} className="text-slate-700 hover:text-slate-900 transition-colors">
                        {proveedor.phone}
                      </a>
                    </p>
                  </div>
                )}
                {proveedor.email && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Email
                      </label>
                    </div>
                    <p className="text-base text-slate-900 font-medium">
                      <a href={`mailto:${proveedor.email}`} className="text-slate-700 hover:text-slate-900 transition-colors">
                        {proveedor.email}
                      </a>
                    </p>
                  </div>
                )}
                {proveedor.website && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Sitio Web
                      </label>
                    </div>
                    <p className="text-base text-slate-900 font-medium">
                      <a 
                        href={proveedor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        {proveedor.website}
                      </a>
                    </p>
                  </div>
                )}
                {proveedor.mainContact && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Contacto Principal
                      </label>
                    </div>
                    <p className="text-base text-slate-900 font-medium">
                      {proveedor.mainContact}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-slate-800 mb-5 flex items-center">
                <svg className="w-5 h-5 mr-2.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Información Tributaria
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proveedor.companyType && (
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Tipo de Empresa
                    </label>
                    <p className="text-base text-slate-900 font-medium">
                      {getCompanyTypeLabel(proveedor.companyType)}
                    </p>
                  </div>
                )}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Clasificación de Empresa
                  </label>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${getClassificationBadge(proveedor.classification)}`}>
                      {getClassificationLabel(proveedor.classification)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-800 mb-5 flex items-center">
                <svg className="w-5 h-5 mr-2.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Información del Sistema
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Fecha de Registro
                    </label>
                  </div>
                  <p className="text-base text-slate-900 font-medium">
                    {formatDate(proveedor.createdAt)}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Última Actualización
                    </label>
                  </div>
                  <p className="text-base text-slate-900 font-medium">
                    {formatDate(proveedor.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {}
          <div className="bg-slate-50 px-8 py-4 flex justify-between items-center border-t border-slate-200">
            <div className="text-xs text-slate-500">
              Última actualización: {formatDate(proveedor.updatedAt)}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white hover:border-slate-400 font-medium transition-colors shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
