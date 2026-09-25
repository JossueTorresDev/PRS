import React from 'react';
import DateFieldGroup from '../../../../ms-07-mantenimiento/components/DateFieldGroup';

const IdentitySection = ({
    formData, setFormData, errors, documentTypes,
    handleChange, calculateAge, person, isEditing,
    disabled = false
}) => {
    return (
        <div className="space-y-6">
            {!person && (
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 rounded-xl p-5 border-l-4 border-l-indigo-500 border border-indigo-100 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        Seleccione el Tipo de Persona
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, personType: 'N', documentTypeId: '' }))}
                            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                                formData.personType === 'N' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.personType === 'N' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm mb-0.5 ${formData.personType === 'N' ? 'text-indigo-700' : 'text-slate-800'}`}>Persona Natural</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Individuo con DNI, Carné de Extranjería o Pasaporte</p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, personType: 'J', documentTypeId: '' }))}
                            className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                                formData.personType === 'J' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.personType === 'J' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm mb-0.5 ${formData.personType === 'J' ? 'text-indigo-700' : 'text-slate-800'}`}>Persona Jurídica</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Empresa u organización con RUC</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl p-5 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                    </span>
                    Documento de Identidad
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {person && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de Persona</label>
                            <select disabled value={formData.personType} className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-slate-500 cursor-not-allowed text-sm">
                                <option value="N">Persona Natural</option>
                                <option value="J">Persona Jurídica</option>
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de Documento <span className="text-red-500">*</span></label>
                        <select
                            name="documentTypeId"
                            value={formData.documentTypeId}
                            onChange={handleChange}
                            disabled={disabled}
                            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm transition-all appearance-none ${disabled ? 'bg-gray-100 text-slate-500 cursor-not-allowed border-gray-200' : 'bg-gray-50 text-slate-900 border-gray-200 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer'} ${errors.documentTypeId ? 'ring-2 ring-red-500' : ''}`}
                            required
                        >
                            <option value="">Seleccione un tipo</option>
                            {documentTypes.map(type => <option key={type.id} value={type.id}>{type.code} - {type.description}</option>)}
                        </select>
                        {errors.documentTypeId && <p className="text-xs text-red-500 mt-1">{errors.documentTypeId}</p>}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Número de Documento <span className="text-red-500">*</span></label>
                            {formData.documentTypeId && (() => {
                                const selectedDoc = documentTypes.find(t => t.id === parseInt(formData.documentTypeId));
                                if (!selectedDoc?.length) return null;
                                const currentLength = formData.documentNumber?.length || 0;
                                const isComplete = currentLength === selectedDoc.length;
                                return (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                        isComplete 
                                        ? 'bg-green-100 text-green-700 border-green-200' 
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        {currentLength} / {selectedDoc.length}
                                    </span>
                                );
                            })()}
                        </div>
                        <input
                            type="text"
                            inputMode="numeric"
                            name="documentNumber"
                            value={formData.documentNumber}
                            onChange={handleChange}
                            maxLength={documentTypes.find(t => t.id === parseInt(formData.documentTypeId))?.length || 20}
                            className={`w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${errors.documentNumber ? 'ring-2 ring-red-500' : ''}`}
                            required
                        />
                        {errors.documentNumber && <p className="text-xs text-red-500 mt-1">{errors.documentNumber}</p>}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                            Fecha de Nacimiento <span className="text-red-500">*</span>
                            {formData.birthDate && (() => {
                                const ageResult = calculateAge(formData.birthDate);
                                return ageResult && ageResult.age !== null && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ageResult.isAdult ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                        {ageResult.age} años {ageResult.isAdult ? '✓' : '✗'}
                                    </span>
                                );
                            })()}
                        </label>
                        <DateFieldGroup
                            value={formData.birthDate}
                            onChange={(newDate) => handleChange({ target: { name: 'birthDate', value: newDate } })}
                            error={errors.birthDate}
                            required
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IdentitySection;
