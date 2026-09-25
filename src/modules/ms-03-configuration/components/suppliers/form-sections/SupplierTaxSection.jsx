import React from 'react';
import { COMPANY_TYPES, CLASSIFICATIONS } from '../supplier.constants';
const PERSONAL_DOC_TYPES = [1, 3, 4]; // DNI, CE, Pasaporte
const DOC_LABELS = { 1: 'DNI', 3: 'CE', 4: 'Pasaporte' };
export default function SupplierTaxSection({ formData, errors, onChange }) {
  const isPersonalDoc = PERSONAL_DOC_TYPES.includes(formData.documentTypesId);
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-800">Información Tributaria</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipo de Empresa {formData.documentTypesId === 2 && <span className="text-red-500">*</span>}
          </label>
          <select
            name="companyType"
            value={formData.companyType}
            onChange={onChange}
            disabled={isPersonalDoc}
            required={formData.documentTypesId === 2}
            className={`w-full px-3 py-2 border border-slate-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent ${
              isPersonalDoc ? 'bg-gray-100 cursor-not-allowed' : ''
            } ${errors.companyType ? 'border-red-300' : ''}`}
          >
            {isPersonalDoc ? (
              <option value="PERSONA NATURAL">Persona Natural</option>
            ) : (
              <>
                <option value="">Seleccionar tipo de empresa</option>
                {COMPANY_TYPES.filter(t => !(formData.documentTypesId === 2 && t.value === 'PERSONA NATURAL')).map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </>
            )}
          </select>
          {errors.companyType && <p className="text-red-600 text-xs mt-1">{errors.companyType}</p>}
          {isPersonalDoc && (
            <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Con {DOC_LABELS[formData.documentTypesId]} solo se permite &apos;Persona Natural&apos;
            </p>
          )}
          {formData.documentTypesId === 2 && (
            <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Con RUC no se permite &apos;Persona Natural&apos;
            </p>
          )}
        </div>
        {}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Clasificación de Empresa <span className="text-red-500">*</span>
          </label>
          <select
            name="classification"
            value={formData.classification}
            onChange={onChange}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.classification ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
          >
            <option value="">Seleccionar clasificación</option>
            {CLASSIFICATIONS.map(cls => (
              <option key={cls.value} value={cls.value}>{cls.label}</option>
            ))}
          </select>
          {errors.classification && <p className="text-red-600 text-xs mt-1">{errors.classification}</p>}
          <small className="text-xs text-slate-500 mt-1">Clasificación según el tamaño de la empresa</small>
        </div>
        {}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isStateProvider"
              name="isStateProvider"
              checked={formData.isStateProvider}
              onChange={onChange}
              className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
            />
            <label htmlFor="isStateProvider" className="ml-2 text-sm font-medium text-slate-700">
              Es proveedor del estado
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
