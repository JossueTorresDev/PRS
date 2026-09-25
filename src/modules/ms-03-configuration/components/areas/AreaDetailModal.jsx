const Field = ({ label, value, mono = false }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">{label}</label>
    <p className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value || "—"}</p>
  </div>
);

const FieldIcon = ({ label, value, icon }) => (
  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">{label}</label>
      <p className="text-sm font-bold text-slate-900">{value || "—"}</p>
    </div>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
    <div className="bg-white/20 p-1 rounded-lg">{icon}</div>
    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
  </div>
);

export default function AreaDetailModal({ isOpen, onClose, area }) {
  if (!isOpen || !area) return null;

  const fmtBudget = (val) =>
    val != null
      ? `S/ ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`
      : '—';

  const fmtLevel = (lvl) =>
    lvl === 1 ? 'Nivel 1 — Gerencia' : lvl === 2 ? 'Nivel 2 — Subgerencia' : lvl ? `Nivel ${lvl}` : '—';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-gray-100 overflow-hidden my-4">

        {/* Header */}
        <div className="bg-emerald-600 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Detalles del Área</h2>
              <p className="text-emerald-100 text-sm">{area.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Identificación */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Identificación" icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              } />
              <div className="p-3 space-y-2">
                <Field label="Código" value={area.areaCode} />
                <Field label="ID Municipio" value={area.municipalityId} mono />
              </div>
            </div>

            {/* Información General */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Información General" icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } />
              <div className="p-3 space-y-2">
                <Field label="Nombre" value={area.name} />
                <Field label="Descripción" value={area.description || 'Sin descripción'} />
              </div>
            </div>

            {/* Organización */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Organización" icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              } />
              <div className="p-3 space-y-2">
                <FieldIcon label="Nivel Jerárquico" value={fmtLevel(area.hierarchicalLevel)} icon={
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                } />
                <FieldIcon label="Ubicación Física" value={area.physicalLocation} icon={
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                } />
              </div>
            </div>

            {/* Contacto y Presupuesto */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader title="Contacto y Presupuesto" icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              } />
              <div className="p-3 space-y-2">
                <FieldIcon label="Teléfono" value={area.phone} icon={
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                } />
                <FieldIcon label="Email" value={area.email} icon={
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                } />
                <FieldIcon label="Presupuesto Anual" value={fmtBudget(area.annualBudget)} icon={
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } />
              </div>
            </div>

            {/* Estado */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden md:col-span-2">
              <SectionHeader title="Sistema" icon={
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              } />
        <div className="p-3">
                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Estado</label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${area.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${area.active ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {area.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition-all flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
