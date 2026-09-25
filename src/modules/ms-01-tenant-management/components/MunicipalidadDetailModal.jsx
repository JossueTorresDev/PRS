import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LogoUpload from './LogoUpload';

const MunicipalidadDetailModal = ({ isOpen, onClose, municipalidad }) => {
  if (!municipalidad) return null;

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
            enterFrom="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block w-full max-w-4xl my-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-[28px] ring-1 ring-black/10">
              <div className="rounded-t-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 sm:px-8 sm:py-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Ficha de Municipalidad</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Detalles de la Municipalidad</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-200">Información general, ubicación y credenciales en una vista más compacta y ordenada.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-6 sm:px-8 sm:py-8">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400 text-center mb-3">Logo</p>
                    <LogoUpload initialLogoUrl={municipalidad.logoUrl} />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Información básica</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{municipalidad.nombre}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>RUC</span>
                        <strong className="text-slate-900">{municipalidad.ruc}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo</span>
                        <strong className="text-slate-900">{municipalidad.tipo}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Ubigeo</span>
                        <strong className="text-slate-900">{municipalidad.ubigeo}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ubicación</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{municipalidad.departamento}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Provincia</span>
                        <strong className="text-slate-900">{municipalidad.provincia}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Distrito</span>
                        <strong className="text-slate-900">{municipalidad.distrito}</strong>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dirección</p>
                        <p className="mt-1 text-sm text-slate-900">{municipalidad.direccion || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Contacto</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{municipalidad.telefono || 'No asignado'}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Celular</span>
                        <strong className="text-slate-900">{municipalidad.celular || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Email</span>
                        <strong className="text-slate-900">{municipalidad.email || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Web</span>
                        <strong className="text-slate-900">{municipalidad.website || '-'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Alcalde</span>
                        <strong className="text-slate-900">{municipalidad.alcalde || '-'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Credenciales</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">Administrador</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Nombre</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{municipalidad.personaNombres || 'No asignado'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Apellido</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{municipalidad.personaApellidos || 'No asignado'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Email</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{municipalidad.personaEmail || 'No asignado'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Usuario</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{municipalidad.adminUsername || 'No asignado'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Hash</p>
                        <p className="mt-1 text-sm font-mono text-slate-900 break-all">{municipalidad.adminPasswordHash || 'No asignado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MunicipalidadDetailModal;
