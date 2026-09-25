import { useEffect, useState } from "react";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService";
import userService from "../../services/userService";

export default function PermissionDetailModal({ isOpen, onClose, permission, onEdit }) {
  const [municipalidad, setMunicipalidad] = useState(null);
  const [loadingMunicipalidad, setLoadingMunicipalidad] = useState(false);
  const [creatorName, setCreatorName] = useState(null);
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    if (isOpen && permission?.municipalCode) loadMunicipalidad();
    else setMunicipalidad(null);
    if (isOpen && permission?.createdBy) loadCreator();
    else setCreatorName(null);
  }, [isOpen, permission]);

  const loadMunicipalidad = async () => {
    try {
      setLoadingMunicipalidad(true);
      const data = await getMunicipalidadById(permission.municipalCode);
      setMunicipalidad(data);
    } catch { setMunicipalidad(null); }
    finally { setLoadingMunicipalidad(false); }
  };

  const loadCreator = async () => {
    try {
      setLoadingCreator(true);
      const user = await userService.getUserById(permission.createdBy);
      setCreatorName(user?.username || null);
    } catch { setCreatorName(null); }
    finally { setLoadingCreator(false); }
  };

  if (!isOpen || !permission) return null;

  const formatDate = (date) => {
    if (!date) return "—";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = date;
        dateObj = new Date(year, month - 1, day, hour, minute, second);
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "—";
      return new Intl.DateTimeFormat("es-PE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(dateObj);
    } catch { return "—"; }
  };

  const getActionBadge = (action) => {
    const badges = {
      read:   { bg: "bg-sky-100", text: "text-sky-800", label: "Lectura" },
      write:  { bg: "bg-emerald-100", text: "text-emerald-800", label: "Escritura" },
      delete: { bg: "bg-red-100", text: "text-red-800", label: "Eliminación" },
      manage: { bg: "bg-violet-100", text: "text-violet-800", label: "Gestión Total" },
      "*":    { bg: "bg-amber-100", text: "text-amber-800", label: "Todos" },
    };
    return badges[action] || { bg: "bg-gray-100", text: "text-gray-800", label: action };
  };

  const actionBadge = getActionBadge(permission.action);
  const isActive = permission.status === true;

  const InfoRow = ({ icon, label, children }) => (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 bg-cyan-50 border border-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-0.5">{label}</p>
        <div className="text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden animate-fadeInScale">

        {}
        <div className="bg-cyan-600 px-7 py-5 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white tracking-tight mb-1.5">
                  {permission.displayName || "Sin nombre"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isActive ? "bg-white text-cyan-700" : "bg-white/30 text-white"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-400"}`}></span>
                    {isActive ? "Activo" : "Inactivo"}
                  </span>
                  {}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                    {actionBadge.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {}
            {permission.description && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{permission.description}</p>
              </div>
            )}

            {}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuración Técnica</h3>
              </div>

              <InfoRow icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" label="Módulo">
                <div className="inline-flex items-center gap-2 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-100">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                  <span className="font-semibold text-cyan-700">{permission.module}</span>
                </div>
              </InfoRow>

              <InfoRow icon="M13 10V3L4 14h7v7l9-11h-7z" label="Acción">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${actionBadge.bg} ${actionBadge.text}`}>
                  {actionBadge.label}
                  <span className="ml-1.5 opacity-50 font-mono text-[10px]">({permission.action})</span>
                </span>
              </InfoRow>

              <InfoRow icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" label="Recurso">
                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-sm">
                  {permission.resource}
                </span>
              </InfoRow>
            </div>

            {}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditoría</h3>
              </div>

              <InfoRow icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Fecha de Creación">
                {formatDate(permission.createdAt)}
              </InfoRow>

              <InfoRow icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label="Creado por">
                {loadingCreator ? (
                  <span className="flex items-center gap-2 text-slate-400 text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-500 border-t-transparent"></div>
                    Cargando...
                  </span>
                ) : (
                  <span>{creatorName || (permission.createdBy ? "Usuario no encontrado" : "Sistema")}</span>
                )}
              </InfoRow>

              {permission.municipalCode && (
                <InfoRow icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" label="Municipalidad">
                  {loadingMunicipalidad ? (
                    <span className="flex items-center gap-2 text-slate-400 text-xs">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-500 border-t-transparent"></div>
                      Cargando...
                    </span>
                  ) : municipalidad ? (
                    <div>
                      <span className="font-semibold">{municipalidad.nombre}</span>
                      <span className="text-slate-400 text-xs ml-2">{municipalidad.tipo} · {municipalidad.distrito}</span>
                    </div>
                  ) : "No disponible"}
                </InfoRow>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="px-7 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0 bg-white">
          <p className="text-xs text-slate-400 font-medium">
            ID: <span className="font-mono text-slate-500">{permission.id}</span>
          </p>
          <div className="flex gap-3">
            {isActive && onEdit && (
              <button
                onClick={() => { onEdit(permission); onClose(); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-xl font-semibold transition-all text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
