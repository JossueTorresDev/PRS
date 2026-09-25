import { FaMapMarkerAlt } from "react-icons/fa";

const LOC_TYPE_LABEL = { OFFICE: 'Oficina', WAREHOUSE: 'Almacén', FIELD: 'Campo', VEHICLE: 'Vehículo', STORAGE: 'Almacenamiento', WORKSHOP: 'Taller' };

const Field = ({ label, value, mono = false }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">{label}</label>
    <p className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value || "—"}</p>
  </div>
);

const FieldIcon = ({ label, value, icon }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">{icon}</div>
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{label}</label>
      <p className="text-sm font-bold text-slate-900">{value || "—"}</p>
    </div>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="bg-teal-600 px-4 py-2.5 flex items-center gap-2">
    <div className="bg-white/20 p-1 rounded-lg">{icon}</div>
    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
  </div>
);

export default function PhysicalLocationDetail({ isOpen, onClose, location }) {
  if (!isOpen || !location) return null;

  const isInactive = location.active === false;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-100 overflow-hidden my-4">

        {/* Header */}
        <div className="bg-teal-600 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Detalle de Ubicación</h2>
              <p className="text-teal-100 text-sm">{location.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Identificación */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Identificación" icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} />
              <div className="p-3 space-y-2">
                <Field label="Código" value={location.locationCode} />
                <Field label="ID Municipio" value={location.municipalityId} mono />
              </div>
            </div>

            {/* Información General */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Información General" icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
              <div className="p-3 space-y-2">
                <Field label="Nombre" value={location.name} />
                <FieldIcon label="Tipo" value={LOC_TYPE_LABEL[location.locationType] || location.locationType} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
                <Field label="Descripción" value={location.description || 'Sin descripción'} />
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Ubicación" icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
              <div className="p-3 space-y-2">
                <FieldIcon label="Dirección" value={location.address} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <FieldIcon label="Piso" value={location.floor != null ? `Piso ${location.floor}` : null} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>} />
                <FieldIcon label="Sector" value={location.sector} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>} />
                {location.reference && <Field label="Referencia" value={location.reference} />}
              </div>
            </div>

            {/* Capacidad y Estado */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Capacidad y Estado" icon={<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>} />
              <div className="p-3 space-y-2">
                <FieldIcon label="Capacidad Máxima" value={location.maxCapacity ? `${location.maxCapacity} personas` : null} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <FieldIcon label="Área" value={location.areaM2 ? `${location.areaM2} m²` : null} icon={<svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>} />
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Estado</label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${isInactive ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-teal-100 text-teal-700 border-teal-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-amber-500' : 'bg-teal-500'}`}></span>
                      {isInactive ? 'Inactiva' : 'Activa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow transition-all flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
