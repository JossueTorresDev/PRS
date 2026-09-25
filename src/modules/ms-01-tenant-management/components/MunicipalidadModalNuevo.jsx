import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, XMarkIcon, UserIcon, BuildingOfficeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { validateRuc, validateUbigeo, getDocumentTypes } from '../services/municipalidadService';
import LogoUpload from './LogoUpload';
import {
  validateRUCFormat,
  validateUBIGEOFormat,
  validateEmailFormat,
  validatePhoneFormat,
  validateCellularFormat,
  validateDNIFormat,
  validatePasswordStrength,
  validateUsernameFormat,
  validateNameFormat,
  validateURLFormat
} from '../utils/validations';

const defaultValues = {
  nombre: '',
  ruc: '',
  ubigeo: '',
  tipo: '',
  departamento: '',
  provincia: '',
  distrito: '',
  direccion: '',
  activo: true,

  // persona (reduced for onboarding)
  personaNombres: '',
  personaApellidos: '',
  personaEmail: '',
  personaDni: '',
  personaTipoDocumento: '',
  personaMunicipalidades: '',

  // usuario (onboarding)
  adminUsername: '',
  adminPassword: ''
};

const baseInputClass = 'w-full px-4 py-3 border border-slate-200 rounded-2xl bg-white text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent';
const inputErrorClass = 'w-full px-4 py-3 border border-rose-400 rounded-2xl bg-white text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent';
const sectionCardClass = 'bg-white p-8 rounded-3xl border border-slate-200 shadow-lg';

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <div className="mt-1 flex items-start gap-2">
      <div className="text-rose-500 font-bold text-lg">●</div>
      <span className="text-rose-500 text-xs font-medium">{error.message}</span>
    </div>
  );
};

// Filtros de entrada para campos específicos
const handleNumericInput = (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
};

const handleLettersOnlyInput = (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s'-]/g, '');
};

const handleLettersAndSpaces = (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s'-]/g, '');
};

// Formatear teléfono como (01) 123 4567
const handlePhoneFormat = (e) => {
  let value = e.target.value.replace(/[^0-9]/g, '');
  
  if (value.length > 10) {
    value = value.slice(0, 10);
  }
  
  if (value.length === 0) {
    e.target.value = '';
  } else if (value.length <= 2) {
    e.target.value = value;
  } else if (value.length <= 5) {
    e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else {
    e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 5)} ${value.slice(5)}`;
  }
};

const validateField = async (fieldName, value, validateFn) => {
  try {
    const response = await validateFn(value);
    return response.valid ? true : response.message;
  } catch (err) {
    console.error(`Error validating ${fieldName}:`, err);
    return true;
  }
};

const MunicipalidadModalNuevo = ({ isOpen, onClose, onSubmit: submitForm, onSuccess, initialData = null }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activeSection, setActiveSection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([
    { id: 1, name: 'DNI' },
    { id: 5, name: 'Pasaporte' },
    { id: 6, name: 'RUC' }
  ]); // Fallback por defecto

  // Cargar document-types al montar
  useEffect(() => {
    const loadDocumentTypes = async () => {
      const types = await getDocumentTypes();
      if (types) {
        setDocumentTypes(types);
      } else {
        console.log('[INFO] Usando document-types por defecto');
      }
    };
    loadDocumentTypes();
  }, []);

  const { register, handleSubmit, reset, formState: { errors }, trigger, setError } = useForm({
    mode: 'onChange',
    defaultValues: initialData || defaultValues,
    shouldUnregister: false
  });

  useEffect(() => {
    reset(initialData || defaultValues);
    setActiveSection(1);
    setLogoUrl(initialData?.logoUrl || null);
  }, [initialData, reset]);

  const sections = [
    { id: 1, title: 'Municipalidad', icon: BuildingOfficeIcon },
    { id: 2, title: 'Persona', icon: UserIcon },
    { id: 3, title: 'Usuario', icon: ShieldCheckIcon }
  ];

  const nextSection = async () => {
    // run validations for current section fields
    if (activeSection === 1) {
      const ok = await trigger(['nombre', 'ruc', 'tipo']);
      if (!ok) return;
    }
    if (activeSection === 2) {
      const ok = await trigger(['personaNombres', 'personaApellidos', 'personaEmail', 'personaDni']);
      if (!ok) return;
    }
    setActiveSection(s => Math.min(s + 1, sections.length));
  };

  const prevSection = () => setActiveSection(s => Math.max(1, s - 1));

  const handleLogoUploadComplete = (url) => {
    setLogoUrl(url);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);

    // Validate RUC and UBIGEO when creating
    if (!isEditing) {
      if (data.ruc) {
        const rucValid = await validateField('ruc', data.ruc, (v) => validateRuc(v, null));
        if (rucValid !== true) {
          setError('ruc', { message: rucValid });
          setLoading(false);
          return;
        }
      }
      if (data.ubigeo) {
        const ubigeoValid = await validateField('ubigeo', data.ubigeo, (v) => validateUbigeo(v, null));
        if (ubigeoValid !== true) {
          setError('ubigeo', { message: ubigeoValid });
          setLoading(false);
          return;
        }
      }
    }

    try {
      await submitForm({ ...data, logoUrl });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Error al crear/actualizar municipalidad');
    } finally {
      setLoading(false);
    }
  };

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case 1:
        return (
          <div className="space-y-8">
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sky-100 rounded-2xl flex items-center justify-center">
                  <BuildingOfficeIcon className="w-5 h-5 text-sky-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900">Información de la Municipalidad</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('nombre', { required: 'El nombre es requerido', validate: validateNameFormat })} className={errors.nombre ? inputErrorClass : baseInputClass} />
                  <ErrorMessage error={errors.nombre} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">RUC <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    maxLength="11"
                    inputMode="numeric"
                    {...register('ruc', { required: 'RUC es obligatorio', validate: validateRUCFormat })} 
                    onInput={handleNumericInput}
                    className={errors.ruc ? inputErrorClass : baseInputClass} 
                    placeholder="Ingrese 11 dígitos"
                  />
                  <ErrorMessage error={errors.ruc} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ubigeo <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    maxLength="6"
                    inputMode="numeric"
                    {...register('ubigeo', { required: 'Ubigeo es obligatorio', validate: validateUBIGEOFormat })} 
                    onInput={handleNumericInput}
                    className={errors.ubigeo ? inputErrorClass : baseInputClass}
                    placeholder="6 dígitos"
                  />
                  <ErrorMessage error={errors.ubigeo} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo <span className="text-rose-500">*</span></label>
                  <select autoComplete="off" {...register('tipo', { required: 'El tipo de municipalidad es requerido' })} className={baseInputClass}>
                    <option value="">Seleccione</option>
                    <option value="PROVINCIAL">PROVINCIAL</option>
                    <option value="DISTRITAL">DISTRITAL</option>
                    <option value="CENTRO POBLADO">CENTRO POBLADO</option>
                  </select>
                  {errors.tipo && <span className="text-rose-500 text-xs">{errors.tipo.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Departamento <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    {...register('departamento', { required: 'Departamento es requerido' })} 
                    onInput={handleLettersAndSpaces}
                    className={baseInputClass}
                    placeholder="Solo letras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Provincia <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    {...register('provincia', { required: 'Provincia es requerido' })} 
                    onInput={handleLettersAndSpaces}
                    className={baseInputClass}
                    placeholder="Solo letras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Distrito <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    {...register('distrito', { required: 'Distrito es requerido' })} 
                    onInput={handleLettersAndSpaces}
                    className={baseInputClass}
                    placeholder="Solo letras"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
                  <input autoComplete="off" {...register('direccion')} className={baseInputClass} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
                  <input 
                    autoComplete="off" 
                    maxLength="14"
                    inputMode="numeric"
                    {...register('telefono', { validate: validatePhoneFormat })} 
                    onInput={handlePhoneFormat}
                    className={errors.telefono ? inputErrorClass : baseInputClass}
                    placeholder="(01) 123 4567"
                  />
                  <ErrorMessage error={errors.telefono} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Celular <span className="text-rose-500">*</span></label>
                  <input 
                    autoComplete="off" 
                    maxLength="9"
                    inputMode="numeric"
                    {...register('celular', { required: 'Celular es obligatorio', validate: validateCellularFormat })} 
                    onInput={handleNumericInput}
                    className={errors.celular ? inputErrorClass : baseInputClass}
                    placeholder="987123456"
                  />
                  <ErrorMessage error={errors.celular} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input autoComplete="off" type="email" {...register('email', { validate: validateEmailFormat })} className={errors.email ? inputErrorClass : baseInputClass} />
                  <ErrorMessage error={errors.email} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Website</label>
                  <input autoComplete="off" type="text" {...register('website', { validate: validateURLFormat })} className={errors.website ? inputErrorClass : baseInputClass} />
                  <ErrorMessage error={errors.website} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alcalde</label>
                  <input autoComplete="off" {...register('alcalde', { validate: (value) => !value || validateNameFormat(value) })} onInput={handleLettersOnlyInput} className={errors.alcalde ? inputErrorClass : baseInputClass} />
                  <ErrorMessage error={errors.alcalde} />
                </div>

                <input type="hidden" value={true} {...register('activo')} />
              </div>
            </div>
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-slate-900">Logo</h4>
              </div>
              <LogoUpload initialLogoUrl={initialData?.logoUrl} onUploadComplete={handleLogoUploadComplete} />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900">Información Personal del Administrador</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombres <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('personaNombres', { required: 'Los nombres son requeridos', validate: validateNameFormat })} className={`${errors.personaNombres ? inputErrorClass : baseInputClass} focus:ring-emerald-500`} />
                  <ErrorMessage error={errors.personaNombres} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Apellidos <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('personaApellidos', { required: 'Los apellidos son requeridos', validate: validateNameFormat })} className={`${errors.personaApellidos ? inputErrorClass : baseInputClass} focus:ring-emerald-500`} />
                  <ErrorMessage error={errors.personaApellidos} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('personaEmail', { required: 'El email es requerido', validate: validateEmailFormat })} className={errors.personaEmail ? `${inputErrorClass} focus:ring-emerald-500` : `${baseInputClass} focus:ring-emerald-500`} />
                  <ErrorMessage error={errors.personaEmail} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Documento</label>
                  <select autoComplete="off" {...register('personaTipoDocumento')} className={`${baseInputClass} focus:ring-emerald-500`}>
                    <option value="">Seleccione</option>
                    {documentTypes.map(dt => (
                      <option key={dt.id} value={dt.id.toString()}>
                        {dt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Número de Documento <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('personaDni', { required: 'El número de documento es requerido', validate: validateDNIFormat })} className={`${errors.personaDni ? inputErrorClass : baseInputClass} focus:ring-emerald-500`} />
                  <ErrorMessage error={errors.personaDni} />
                </div>

                <input type="hidden" {...register('personaMunicipalidades')} />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className={sectionCardClass}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-violet-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900">Credenciales de Acceso</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Usuario <span className="text-rose-500">*</span></label>
                  <input autoComplete="off" {...register('adminUsername', { required: 'El usuario es obligatorio', validate: validateUsernameFormat })} className={`${errors.adminUsername ? inputErrorClass : baseInputClass} focus:ring-violet-500`} />
                  <ErrorMessage error={errors.adminUsername} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña {isEditing ? '(Opcional)' : <span className="text-rose-500">*</span>}</label>
                  <div className="relative">
                    <input
                      autoComplete={isEditing ? 'current-password' : 'new-password'}
                      type={showPassword ? 'text' : 'password'}
                      {...register('adminPassword', {
                        required: !isEditing ? 'Contraseña es obligatoria' : false,
                        validate: (value) => !value || validatePasswordStrength(value)
                      })}
                      className={`${errors.adminPassword ? inputErrorClass : baseInputClass} focus:ring-violet-500 pr-12`} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700 focus:outline-none"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <ErrorMessage error={errors.adminPassword} />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" aria-hidden="true" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-[32px] ring-1 ring-black/5">
              <div className="relative">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Dialog.Title className="text-3xl font-bold text-white">{isEditing ? 'Editar Municipalidad' : 'Nueva Municipalidad'}</Dialog.Title>
                      <p className="mt-2 text-slate-300">Complete la información requerida para {isEditing ? 'actualizar' : 'crear'} la municipalidad y su administrador.</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-slate-200 rounded-full p-3 bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="px-8 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-3">
                      {sections.map((s) => {
                        const Icon = s.icon;
                        const active = activeSection === s.id;
                        const completed = activeSection > s.id;
                        return (
                          <button key={s.id} type="button" onClick={() => setActiveSection(s.id)} className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${active ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25 scale-105' : completed ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${active ? 'bg-white/20' : completed ? 'bg-white/20' : 'bg-slate-100'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {s.title}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200">
                      Paso {activeSection} de {sections.length}
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 max-h-[65vh] overflow-y-auto bg-slate-50/50">
                  {submitError && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl shadow-sm">{submitError}</div>}

                  <form noValidate autoComplete="off" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                    <div className="hidden">
                      <input type="text" name="fakeusernameremembered" autoComplete="off" />
                      <input type="password" name="fakepasswordremembered" autoComplete="new-password" />
                    </div>
                    <div className={activeSection === 1 ? '' : 'hidden'}>{renderSectionContent(1)}</div>
                    <div className={activeSection === 2 ? '' : 'hidden'}>{renderSectionContent(2)}</div>
                    <div className={activeSection === 3 ? '' : 'hidden'}>{renderSectionContent(3)}</div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-8 border-t border-slate-200">
                      <div className="flex flex-wrap gap-3">
                        {activeSection > 1 && <button type="button" onClick={prevSection} className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium">← Anterior</button>}
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-medium">Cancelar</button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {activeSection < sections.length ? (
                          <button type="button" onClick={nextSection} className="px-8 py-3 bg-sky-600 text-white rounded-2xl shadow-lg shadow-sky-600/25 hover:bg-sky-700 hover:shadow-xl hover:shadow-sky-600/30 transition-all duration-200 font-semibold">Siguiente →</button>
                        ) : (
                          <button type="submit" disabled={loading} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? '⏳ Guardando...' : (isEditing ? '✓ Actualizar Municipalidad' : '✓ Crear Municipalidad')}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MunicipalidadModalNuevo;
