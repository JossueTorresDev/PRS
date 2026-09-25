import { useEffect, useState } from "react";
import documentTypeService from "../../services/documentTypeService";
import { getMunicipalidadById } from "../../../ms-01-tenant-management/services/municipalidadService";

export default function PersonDetailModal({ isOpen, onClose, person }) {
  const [documentTypeName, setDocumentTypeName] = useState("");
  const [municipalidad, setMunicipalidad] = useState(null);
  const [loadingMunicipalidad, setLoadingMunicipalidad] = useState(false);

  useEffect(() => {
    if (isOpen && person?.documentTypeId) {
      loadDocumentType();
    }
    if (isOpen && person?.municipalCode) {
      loadMunicipalidad();
    } else {
      setMunicipalidad(null);
    }
  }, [isOpen, person]);

  const loadDocumentType = async () => {
    try {
      const docType = await documentTypeService.getDocumentTypeById(person.documentTypeId);
      if (docType) {
        setDocumentTypeName(docType.code || docType.name || "");
      }
    } catch (error) {
      setDocumentTypeName("");
    }
  };

  const loadMunicipalidad = async () => {
    try {
      setLoadingMunicipalidad(true);
      const data = await getMunicipalidadById(person.municipalCode);
      setMunicipalidad(data);
    } catch (error) {
      setMunicipalidad(null);
    } finally {
      setLoadingMunicipalidad(false);
    }
  };

  if (!isOpen || !person) return null;

  const getPersonStatus = (person) => {
    if (typeof person.status === "boolean") {
      return person.status ? "ACTIVE" : "INACTIVE";
    }
    if (typeof person.active === "boolean") {
      return person.active ? "ACTIVE" : "INACTIVE";
    }
    return "ACTIVE";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      let dateObj;
      if (Array.isArray(date)) {
        const [year, month, day] = date;
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
      if (isNaN(dateObj.getTime())) return "-";
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj);
    } catch {
      return "-";
    }
  };

  const formatDateTime = (date) => {
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
    } catch {
      return "-";
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    try {
      let dateObj;
      if (Array.isArray(birthDate)) {
        const [year, month, day] = birthDate;
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(birthDate);
      }
      if (isNaN(dateObj.getTime())) return null;

      const today = new Date();
      let ageCalculated = today.getFullYear() - dateObj.getFullYear();
      const m = today.getMonth() - dateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) {
        ageCalculated--;
      }
      return ageCalculated;
    } catch {
      return null;
    }
  };

  const personStatus = getPersonStatus(person);
  const age = person.age !== undefined && person.age !== null ? person.age : calculateAge(person.birthDate);

  const getPersonTypeName = (type) => {
    if (type === "N" || type === "NATURAL") return "Persona Natural";
    if (type === "J" || type === "JURIDICA") return "Persona Jurídica";
    return type || "-";
  };

  const getGenderName = (gender) => {
    if (gender === "M") return "Masculino";
    if (gender === "F") return "Femenino";
    return gender || "-";
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-cyan-100 overflow-hidden animate-fadeInScale">
        {}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-4 py-3">
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${personStatus === "ACTIVE" ? "bg-green-400" : "bg-slate-400"}`}></div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {person.fullName || `${person.firstName || ""} ${person.lastName || ""}`.trim() || "Sin nombre"}
                </h2>
                <p className="text-cyan-100 text-[11px] font-medium">
                  {personStatus === "ACTIVE" ? "Activo" : "Inactivo"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {}
        <div className="p-3 bg-gradient-to-br from-slate-50 to-cyan-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {}
            <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-3 hover:shadow-md hover:border-cyan-200 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  Información Personal
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Tipo de Persona
                    </label>
                    <p className="text-[11px] font-semibold text-slate-900">
                      {getPersonTypeName(person.personType)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Tipo de Documento
                    </label>
                    <p className="text-[11px] font-semibold text-slate-900">
                      {documentTypeName || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1 col-span-2">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Número de Documento
                    </label>
                    <p className="text-[11px] font-mono font-semibold text-slate-900">
                      {person.documentNumber || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Fecha de Nacimiento
                    </label>
                    <p className="text-[11px] font-semibold text-slate-900">
                      {formatDate(person.birthDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Edad
                    </label>
                    <p className="text-[11px] font-semibold text-slate-900">
                      {age !== null ? `${age} años` : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1 col-span-2">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Género
                    </label>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${person.gender === "M"
                        ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                        : "bg-pink-100 text-pink-700 border border-pink-200"
                      }`}>
                      {getGenderName(person.gender)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-3 hover:shadow-md hover:border-cyan-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  Información de Contacto
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Email Personal
                    </label>
                    <p className="text-[11px] text-cyan-600 font-medium break-all">
                      {person.personalEmail || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Número Celular
                    </label>
                    <p className="text-[11px] font-mono font-medium text-slate-900">
                      {person.personalPhone || "-"}
                    </p>
                  </div>
                </div>
                {person.workPhone && (
                  <div className="flex items-start gap-1">
                    <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3l-6 6m0 0V4m0 5h5M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                        Teléfono de Trabajo
                      </label>
                      <p className="text-[11px] font-mono font-medium text-slate-900">
                        {person.workPhone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-3 hover:shadow-md hover:border-cyan-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  Dirección
                </h3>
              </div>
              <div className="flex items-start gap-1">
                <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div className="flex-1">
                  <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                    Dirección Completa
                  </label>
                  <p className="text-[11px] font-medium text-slate-900 leading-relaxed">
                    {person.address || "-"}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-3 hover:shadow-md hover:border-cyan-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  Auditoría
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Creación
                    </label>
                    <p className="text-[10px] text-slate-900 font-medium">
                      {formatDateTime(person.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <svg className="w-3 h-3 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide block mb-0.5">
                      Actualización
                    </label>
                    <p className="text-[10px] text-slate-900 font-medium">
                      {formatDateTime(person.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-3 hover:shadow-md hover:border-cyan-200 transition-all duration-200 h-fit">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">
                  Municipalidad
                </h3>
              </div>
              {loadingMunicipalidad ? (
                <div className="flex items-center gap-1.5 text-cyan-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-cyan-600 border-t-transparent"></div>
                  <span className="text-[11px]">Cargando...</span>
                </div>
              ) : municipalidad ? (
                <div className="space-y-1.5">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                    <p className="text-[11px] font-bold text-slate-900 mb-0.5">
                      {municipalidad.nombre}
                    </p>
                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-700">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {municipalidad.tipo}
                      </span>
                      <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">
                        {municipalidad.distrito}
                      </span>
                    </div>
                  </div>
                </div>
              ) : person.municipalCode ? (
                <div className="space-y-0.5">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                    ID Municipal
                  </p>
                  <p className="text-[11px] font-mono font-medium text-slate-800 break-all bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    {person.municipalCode}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No asignado</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

