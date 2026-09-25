import React from 'react';

const PersonalInfoSection = ({ formData, setFormData, errors, handleChange, disabled = false }) => {
    const selectedGender = formData.gender === 'M' ? 'Masculino' : 'Femenino';

    return (
        <div className="bg-white rounded-xl p-5 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombres <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Ej: Juan Carlos"
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${errors.firstName ? 'ring-2 ring-red-500' : ''}`}
                        required
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Apellidos <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Ej: Pérez García"
                        className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${errors.lastName ? 'ring-2 ring-red-500' : ''}`}
                        required
                    />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Género <span className="text-red-500">*</span></label>
                    {disabled ? (
                        <div className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-slate-500 text-sm cursor-not-allowed flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${formData.gender === 'M' ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                                {formData.gender === 'M' ? 'M' : 'F'}
                            </span>
                            {selectedGender}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, gender: 'M' }))}
                                className={`p-3.5 rounded-lg border-2 transition-all duration-200 flex items-center gap-2.5 ${formData.gender === 'M' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${formData.gender === 'M' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>M</div>
                                <span className={`text-sm font-bold ${formData.gender === 'M' ? 'text-indigo-700' : 'text-slate-600'}`}>Masculino</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, gender: 'F' }))}
                                className={`p-3.5 rounded-lg border-2 transition-all duration-200 flex items-center gap-2.5 ${formData.gender === 'F' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${formData.gender === 'F' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'}`}>F</div>
                                <span className={`text-sm font-bold ${formData.gender === 'F' ? 'text-pink-700' : 'text-slate-600'}`}>Femenino</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalInfoSection;
