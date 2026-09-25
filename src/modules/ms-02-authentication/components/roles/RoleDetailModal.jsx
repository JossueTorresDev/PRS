import { useEffect, useState } from "react";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService";
import userService from "../../services/userService";

export default function RoleDetailModal({ isOpen, onClose, role }) {
  const [municipalidad, setMunicipalidad] = useState(null);
  const [loadingMunicipalidad, setLoadingMunicipalidad] = useState(false);
  const [creatorName, setCreatorName] = useState(null);
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    if (isOpen && role?.municipalCode) {
      loadMunicipalidad();
    } else {
      setMunicipalidad(null);
    }

    if (isOpen && role?.createdBy) {
      loadCreator();
    } else {
      setCreatorName(null);
    }
  }, [isOpen, role]);

  const loadMunicipalidad = async () => {
    try {
      setLoadingMunicipalidad(true);
      const data = await getMunicipalidadById(role.municipalCode);
      setMunicipalidad(data);
    } catch (error) {
      setMunicipalidad(null);
    } finally {
      setLoadingMunicipalidad(false);
    }
  };

  const loadCreator = async () => {
    try {
      setLoadingCreator(true);
      const user = await userService.getUserById(role.createdBy);
      setCreatorName(user?.username || null);
    } catch (error) {
      setCreatorName(null);
    } finally {
      setLoadingCreator(false);
    }
  };

  if (!isOpen || !role) return null;

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = date;
        dateObj = new Date(year, month - 1, day, hour, minute, second);
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "-";
      return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch (error) {
      return "-";
    }
  };

  const getStatusInfo = (active) => {
    return active
      ? {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: "✓",
          label: "Activo",
        }
      : {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: "○",
          label: "Inactivo",
        };
  };

  const statusInfo = getStatusInfo(role.active);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col border border-cyan-100 overflow-hidden animate-fadeInScale">
        {}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-8 py-6 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border-2 border-white/30">
                <span className="text-2xl font-bold text-white">
                  {role.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {role.name}
                </h2>
                <p className="text-cyan-50 text-sm font-medium mb-2">
                  Información completa del rol
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.bg} ${statusInfo.text} border-2 ${statusInfo.border} shadow-sm`}
                  >
                    <span className="text-base">{statusInfo.icon}</span>
                    {statusInfo.label}
                  </span>
                  {(role.isSystem || role.is_system) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white border-2 border-white/30">
                      Sistema
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2.5 transition-all duration-200 backdrop-blur-sm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {}
        <div className="p-6 bg-gradient-to-br from-slate-50 to-cyan-50/30 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-cyan-100 p-5 hover:shadow-lg hover:border-cyan-200 transition-all duration-200 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Descripción
                </h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3">
                {role.description || "Sin descripción disponible"}
              </p>
            </div>

            {}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-cyan-100 p-5 hover:shadow-lg hover:border-cyan-200 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Configuración
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Tipo de Rol
                    </label>
                    <p className="text-sm font-semibold text-slate-900">
                      {role.isSystem || role.is_system ? "Sistema" : "Personalizado"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {role.isSystem || role.is_system
                        ? "No puede ser eliminado"
                        : "Creado por el usuario"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Estado
                    </label>
                    <p className={`text-sm font-semibold ${role.active ? "text-emerald-600" : "text-slate-700"}`}>
                      {role.active ? "Activo" : "Inactivo"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {role.active ? "Disponible para asignación" : "No disponible"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-cyan-100 p-5 hover:shadow-lg hover:border-cyan-200 transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Auditoría
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Creación
                    </label>
                    <p className="text-xs text-slate-900 font-medium">
                      {formatDate(role.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Creado por
                    </label>
                    {loadingCreator ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-600 border-t-transparent"></div>
                        <span className="text-xs text-slate-500">Cargando...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-900 font-medium">
                        {creatorName || (role.createdBy ? "Usuario no encontrado" : "Sistema")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {}
            {role.municipalCode && (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-cyan-100 p-5 hover:shadow-lg hover:border-cyan-200 transition-all duration-200 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    🏛️ Municipalidad
                  </h3>
                </div>
                {loadingMunicipalidad ? (
                  <div className="flex items-center gap-2 text-cyan-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-600 border-t-transparent"></div>
                    <span className="text-xs">Cargando...</span>
                  </div>
                ) : municipalidad ? (
                  <div className="space-y-2">
                    <div className="bg-slate-50 px-4 py-3 rounded-xl">
                      <p className="text-sm font-bold text-slate-900 mb-1">
                        {municipalidad.nombre}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-700">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          {municipalidad.tipo}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                          {municipalidad.distrito}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No se pudo cargar la información</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

