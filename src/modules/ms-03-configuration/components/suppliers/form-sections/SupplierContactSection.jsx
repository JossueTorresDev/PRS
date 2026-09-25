import React from 'react';
export default function SupplierContactSection({ formData, errors, onChange, onBlur }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h4 className="text-xl font-bold text-slate-800">Información de Contacto</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Dirección Legal</span><span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              errors.address ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
            }`}
            placeholder="Av. Principal 123, Lima"
          />
          {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
        </div>
        {}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Teléfono</span><span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="987654321"
          />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>
        {}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Email</span><span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="contacto@abc.com"
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>
        {}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sitio Web</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.website ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="https://abc.com"
          />
          {errors.website && <p className="text-red-600 text-xs mt-1">{errors.website}</p>}
        </div>
        {}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <span>Contacto Principal</span><span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="mainContact"
            value={formData.mainContact || ''}
            onChange={onChange}
            onBlur={onBlur}
            required
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white ${
              errors.mainContact ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="Juan Pérez"
          />
          {errors.mainContact && <p className="text-red-600 text-xs mt-1">{errors.mainContact}</p>}
        </div>
      </div>
    </div>
  );
}