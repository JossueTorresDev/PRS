import React from 'react';
import { obtenerPlaceholderDocumento } from '../../../services/api';
export default function SupplierBasicInfoSection({ formData, errors, tiposDocumento, checkingDocument, onChange, onBlur }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-800">Información Básica</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Tipo de Documento</span><span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <select
              name="documentTypesId"
              value={formData.documentTypesId}
              onChange={onChange}
              required
              className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                errors.documentTypesId ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            >
              {tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>{tipo.name} - {tipo.description}</option>
              ))}
            </select>
          </div>
          {errors.documentTypesId && <p className="text-red-600 text-xs mt-1">{errors.documentTypesId}</p>}
        </div>
        {}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Número de Documento <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="numeroDocumento"
              value={formData.numeroDocumento}
              onChange={onChange}
              onBlur={onBlur}
              required
              maxLength={formData.documentTypesId === 1 ? 8 : formData.documentTypesId === 2 ? 11 : 9}
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
                errors.numeroDocumento ? 'border-red-300 bg-red-50' : 'border-slate-300'
              } ${checkingDocument ? 'pr-10' : ''}`}
              placeholder={obtenerPlaceholderDocumento(formData.documentTypesId)}
            />
            {checkingDocument && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
          {errors.numeroDocumento && <p className="text-red-600 text-xs mt-1">{errors.numeroDocumento}</p>}
        </div>
        {}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Razón Social <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="legalName"
            value={formData.legalName}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.legalName ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="Empresa ABC S.A.C."
          />
          {errors.legalName && <p className="text-red-600 text-xs mt-1">{errors.legalName}</p>}
        </div>
        {}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Nombre Comercial</span><span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="tradeName"
            value={formData.tradeName}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.tradeName ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="ABC Corp"
          />
          {errors.tradeName && <p className="text-red-600 text-xs mt-1">{errors.tradeName}</p>}
        </div>
      </div>
    </div>
  );
}
