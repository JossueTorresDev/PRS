import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { validateRuc, validateUbigeo } from '../services/municipalidadService';

const defaultValues = {
  nombre: '',
  ruc: '',
  ubigeo: '',
  tipo: '',
  departamento: '',
  provincia: '',
  distrito: '',
  direccion: '',
  telefono: '',
  celular: '',
  email: '',
  website: '',
  alcalde: '',
  activo: true
};

const validateField = async (fieldName, value, validateFn) => {
  try {
    const response = await validateFn(value);
    console.log(`Respuesta validación ${fieldName}:`, response);
    // Solo validar si el campo ha cambiado
    return response.valid ? true : response.message;
  } catch (error) {
    console.error(`Error validando ${fieldName}:`, error);
    return true; // Permitir continuar en caso de error de validación
  }
};

const MunicipalidadModal = ({ isOpen, onClose, onSubmit: submitForm, onSuccess, initialData = null }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
    setError,
    clearErrors,
    setValue
  } = useForm({
    defaultValues: {
      nombre: initialData?.nombre || '',
      ruc: initialData?.ruc || '',
      ubigeo: initialData?.ubigeo || '',
      tipo: initialData?.tipo || '',
      departamento: initialData?.departamento || '',
      provincia: initialData?.provincia || '',
      distrito: initialData?.distrito || '',
      direccion: initialData?.direccion || '',
      telefono: initialData?.telefono || '',
      celular: initialData?.celular || '',
      email: initialData?.email || '',
      website: initialData?.website || '',
      alcalde: initialData?.alcalde || '',
      activo: initialData?.activo ?? true,
      adminUsername: initialData?.adminUsername || '',
      adminPassword: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialData || defaultValues);
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);

    // Solo validar RUC y Ubigeo si han cambiado
    const rucChanged = isEditing && initialData.ruc !== data.ruc;
    const ubigeoChanged = isEditing && initialData.ubigeo !== data.ubigeo;

    const validations = [];

    if (!isEditing || rucChanged) {
      validations.push(validateField('ruc', data.ruc, (ruc) => validateRuc(ruc, isEditing ? initialData.id : null)));
    }

    if (!isEditing || ubigeoChanged) {
      validations.push(validateField('ubigeo', data.ubigeo, (ubigeo) => validateUbigeo(ubigeo, isEditing ? initialData.id : null)));
    }

    if (validations.length > 0) {
      const results = await Promise.all(validations);

      if ((!isEditing || rucChanged) && results[0] !== true) {
        setError('ruc', { message: results[0] });
        setLoading(false);
        return;
      }

      if ((!isEditing || ubigeoChanged) && results[results.length - 1] !== true) {
        setError('ubigeo', { message: results[results.length - 1] });
        setLoading(false);
        return;
      }
    }

    try {
      await submitForm(data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar la municipalidad');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" aria-hidden="true" />
          </Transition.Child>

          {/* Este elemento es para engañar al navegador para que centre el contenido del modal */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
              <div className="relative">
                <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-white">
                      {isEditing ? 'Editar Municipalidad' : 'Nueva Municipalidad'}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors duration-150 rounded-full p-1 hover:bg-cyan-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-cyan-50 to-white px-6 py-2">
                  <p className="text-sm text-cyan-700">
                    {isEditing ? 'Actualice la información de la municipalidad' : 'Complete el formulario para registrar una nueva municipalidad'}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto bg-gray-50">
                {submitError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* Información Básica */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Información Básica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de la Municipalidad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('nombre', {
                            required: 'El nombre de la municipalidad es requerido',
                            maxLength: {
                              value: 255,
                              message: 'El nombre no puede exceder los 255 caracteres'
                            },
                            pattern: {
                              value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                              message: 'El nombre solo puede contener letras y espacios'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Nombre oficial de la municipalidad"
                        />
                        {errors.nombre && (
                          <span className="text-red-500 text-xs">{errors.nombre.message}</span>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RUC <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('ruc', {
                            required: 'El RUC es requerido',
                            pattern: {
                              value: /^\d{11}$/,
                              message: 'El RUC debe tener 11 dígitos'
                            },
                            validate: async value => {
                              if (!value || value.length !== 11) return true;
                              if (isEditing && value === initialData.ruc) return true;
                              console.log('Validando RUC:', value, 'isEditing:', isEditing, 'initialData:', initialData);
                              return await validateField('ruc', value, async (ruc) => {
                                const currentId = isEditing && initialData ? initialData.id : null;
                                console.log('Llamando a validateRuc con ID:', currentId);
                                return validateRuc(ruc, currentId);
                              });
                            }
                          })}
                          onChange={e => {
                            if (e.target.value.length === 11) {
                              trigger('ruc');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="20123456789"
                          maxLength={11}
                        />
                        {errors.ruc && (
                          <span className="text-red-500 text-xs">{errors.ruc.message}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Credenciales del Administrador (Reubicado debajo de Información Básica) */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                    <h3 className="flex items-center text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      CREDENCIALES DEL ADMINISTRADOR
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario Administrador <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            {...register('adminUsername', {
                              required: 'El usuario es obligatorio',
                              minLength: { value: 4, message: 'Mínimo 4 caracteres' }
                            })}
                            autoComplete="off"
                            className={`w-full pl-10 pr-4 py-3 bg-white border ${errors.adminUsername ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400'} rounded-xl transition-all outline-none text-sm font-medium`}
                            placeholder="Ej: admin_muni"
                          />
                        </div>
                        {errors.adminUsername && <p className="mt-2 text-xs font-medium text-red-500 flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.adminUsername.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Contraseña {initialData ? '(Opcional para actualizar)' : <span className="text-red-500">*</span>}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <input
                            type="password"
                            {...register('adminPassword', {
                              required: !initialData ? 'La contraseña es obligatoria' : false,
                              minLength: !initialData || initialData.adminPassword ? { value: 8, message: 'Mínimo 8 caracteres' } : false,
                              pattern: !initialData || initialData.adminPassword ? {
                                value: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/,
                                message: 'Debe incluir mayúscula, minúscula, número y símbolo (@#$%^&+=!)'
                              } : false
                            })}
                            autoComplete="new-password"
                            className={`w-full pl-10 pr-4 py-3 bg-white border ${errors.adminPassword ? 'border-red-300 ring-4 ring-red-50' : 'border-gray-200 focus:ring-4 focus:ring-cyan-100 focus:border-cyan-400'} rounded-xl transition-all outline-none text-sm font-medium`}
                            placeholder={initialData ? "Dejar en blanco para no cambiar" : "******"}
                          />
                        </div>
                        {errors.adminPassword && <p className="mt-2 text-xs font-medium text-red-500 flex items-center"><svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.adminPassword.message}</p>}
                      </div>
                    </div>
                  </div>


                  {/* Ubicación */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Municipalidad <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            {...register('tipo', {
                              required: 'El tipo de municipalidad es requerido'
                            })}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm transition-colors duration-150 appearance-none"
                          >
                            <option value="">Seleccione un tipo</option>
                            <option value="PROVINCIAL">Provincial</option>
                            <option value="DISTRITAL">Distrital</option>
                            <option value="CENTRO POBLADO">Centro Poblado</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {errors.tipo && (
                          <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>
                        )}
                      </div>                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ubigeo <span className="text-red-500">*</span>
                          <span className="text-xs text-gray-500 ml-1">(Código INEI)</span>
                        </label>
                        <input
                          type="text"
                          {...register('ubigeo', {
                            required: 'El ubigeo es requerido',
                            pattern: {
                              value: /^\d{6}$/,
                              message: 'El ubigeo debe tener 6 dígitos'
                            },
                            validate: async value => {
                              if (!value || value.length !== 6) return true;
                              if (isEditing && value === initialData.ubigeo) return true;
                              return await validateField('ubigeo', value, (ubigeo) => validateUbigeo(ubigeo, isEditing ? initialData.id : null));
                            }
                          })}
                          onChange={e => {
                            if (e.target.value.length === 6) {
                              trigger('ubigeo');
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm transition-colors duration-150"
                          placeholder="123456"
                          maxLength={6}
                        />
                        {errors.ubigeo && (
                          <span className="text-red-500 text-xs">{errors.ubigeo.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Departamento <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('departamento', {
                            required: 'El departamento es requerido',
                            pattern: {
                              value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                              message: 'El departamento solo puede contener letras y espacios'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {errors.departamento && (
                          <span className="text-red-500 text-xs">{errors.departamento.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Provincia <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('provincia', {
                            required: 'La provincia es requerida',
                            pattern: {
                              value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                              message: 'La provincia solo puede contener letras y espacios'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {errors.provincia && (
                          <span className="text-red-500 text-xs">{errors.provincia.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distrito <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('distrito', {
                            required: 'El distrito es requerido',
                            pattern: {
                              value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                              message: 'El distrito solo puede contener letras y espacios'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {errors.distrito && (
                          <span className="text-red-500 text-xs">{errors.distrito.message}</span>
                        )}
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register('direccion', { required: 'La dirección es requerida' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Av. Principal 123"
                        />
                        {errors.direccion && (
                          <span className="text-red-500 text-xs">{errors.direccion.message}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Información de Contacto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Teléfono <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={13}
                          {...register('telefono', {
                            required: 'El teléfono es requerido',
                            pattern: {
                              value: /^\(01\) \d{3} \d{4}$/,
                              message: "Formato requerido: (01) 123 4567"
                            }
                          })}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const body = raw.startsWith('01') ? raw.slice(2) : raw;
                            const digits = body.replace(/\D/g, '').slice(0, 7);
                            const first = digits.slice(0, 3);
                            const last = digits.slice(3, 7);
                            let formatted = '(01) ';
                            if (first) formatted += first;
                            if (last) formatted += ' ' + last;
                            setValue('telefono', formatted, { shouldValidate: true, shouldDirty: true });
                          }}
                          onBlur={(e) => {
                            if (!e.target.value || e.target.value === '(01) ') {
                              setValue('telefono', '');
                            }
                          }}
                          onFocus={(e) => {
                            if (!e.target.value) {
                              setValue('telefono', '(01) ');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent tracking-wider"
                          placeholder="(01) 123 4567"
                        />
                        {errors.telefono && (
                          <span className="text-red-500 text-xs">{errors.telefono.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Celular (opcional)
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={13}
                          {...register('celular', {
                            validate: (value) => {
                              if (!value) return true; // opcional
                              return /^\+51 9\d{8}$/.test(value) || 'Formato requerido: +51 9XXXXXXXX';
                            }
                          })}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            let digits = raw;
                            if (!digits.startsWith('51')) digits = '51' + digits.replace(/^51/, '');
                            digits = digits.slice(0, 2) + '9' + digits.slice(2).replace(/^9?/, '');
                            digits = digits.slice(0, 11);
                            const tail = digits.slice(3);
                            const formatted = `+51 9${tail}`;
                            setValue('celular', formatted, { shouldValidate: true, shouldDirty: true });
                          }}
                          onFocus={(e) => {
                            if (!e.target.value) {
                              setValue('celular', '+51 9');
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '+51 9') {
                              setValue('celular', '');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent tracking-wider"
                          placeholder="+51 9XXXXXXXX"
                        />
                        {errors.celular && (
                          <span className="text-red-500 text-xs">{errors.celular.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          {...register('email', {
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Ingrese un email válido'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="ejemplo@municipalidad.gob.pe"
                        />
                        {errors.email && (
                          <span className="text-red-500 text-xs">{errors.email.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sitio Web
                        </label>
                        <input
                          type="url"
                          {...register('website', {
                            maxLength: {
                              value: 300,
                              message: 'La URL no puede exceder los 300 caracteres'
                            },
                            pattern: {
                              value: /^https?:\/\/.+/,
                              message: 'Ingrese una URL válida'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="https://www.municipalidad.gob.pe"
                        />
                        {errors.website && (
                          <span className="text-red-500 text-xs">{errors.website.message}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alcalde
                        </label>
                        <input
                          type="text"
                          {...register('alcalde', {
                            pattern: {
                              value: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
                              message: 'El nombre del alcalde solo puede contener letras y espacios'
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Nombre del alcalde"
                        />
                        {errors.alcalde && (
                          <span className="text-red-500 text-xs">{errors.alcalde.message}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Campo activo oculto */}
                  <input
                    type="hidden"
                    {...register('activo')}
                    defaultValue={true}
                  />

                  {/* Botones de acción */}
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 -mx-6 mt-6 border-t border-gray-200">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-150"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-colors duration-150 shadow-sm"
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                          </span>
                        ) : (
                          isEditing ? 'Actualizar' : 'Guardar'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MunicipalidadModal;
