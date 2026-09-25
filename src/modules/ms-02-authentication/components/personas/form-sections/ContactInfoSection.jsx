import React from 'react';

const ContactInfoSection = ({ formData, errors, handleChange }) => {
    return (
        <div className="bg-white rounded-xl p-5 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </span>
                Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Celular Personal <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="personalPhone"
                        value={formData.personalPhone}
                        onChange={handleChange}
                        maxLength="9"
                        placeholder="Ej: 987654321"
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${errors.personalPhone ? 'ring-2 ring-red-500' : ''}`}
                        required
                    />
                    {errors.personalPhone && <p className="text-xs text-red-500 mt-1">{errors.personalPhone}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono Trabajo <span className="text-gray-400 text-[10px] normal-case tracking-normal">(Opcional)</span></label>
                    <input
                        type="text"
                        name="workPhone"
                        value={formData.workPhone}
                        onChange={handleChange}
                        placeholder="Ej: 013456789"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Correo Electrónico <span className="text-gray-400 text-[10px] normal-case tracking-normal">(Opcional)</span></label>
                    <input
                        type="email"
                        name="personalEmail"
                        value={formData.personalEmail}
                        onChange={handleChange}
                        placeholder="Ej: juan.perez@example.com"
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${errors.personalEmail ? 'ring-2 ring-red-500' : ''}`}
                    />
                    {errors.personalEmail && <p className="text-xs text-red-500 mt-1">{errors.personalEmail}</p>}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dirección de Domicilio <span className="text-red-500">*</span></label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows="2"
                        placeholder="Ej: Av. Las Flores 123, Urb. Primavera"
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 resize-none ${errors.address ? 'ring-2 ring-red-500' : ''}`}
                        required
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
            </div>
        </div>
    );
};

export default ContactInfoSection;
