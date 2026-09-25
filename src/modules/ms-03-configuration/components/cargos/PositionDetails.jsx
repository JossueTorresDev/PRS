const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const dateFormatted = new Intl.DateTimeFormat("es-PE", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
  const timeFormatted = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(date);
  return `${dateFormatted} ${timeFormatted}`;
};

const Field = ({ label, value, mono = false }) => (
  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
    <p className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value || "—"}</p>
  </div>
);

const SectionHeader = ({ icon, title }) => (
  <div className="bg-blue-600 px-5 py-3.5 flex items-center gap-3">
    <div className="bg-white/20 p-1.5 rounded-lg">
      {icon}
    </div>
    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
  </div>
);

export default function PositionDetails({ position, onClose }) {
  if (!position) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Detalles del Cargo</h2>
              <p className="text-blue-100 text-sm">{position.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Identificación */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader
                title="Identificación"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                }
              />
              <div className="p-4 space-y-3">
                <Field label="Código" value={position.positionCode} />
                <Field label="ID Municipio" value={position.municipalityId} mono />
              </div>
            </div>

            {/* Información General */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader
                title="Información General"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <div className="p-4 space-y-3">
                <Field label="Nombre" value={position.name} />
                <Field label="Descripción" value={position.description || "Sin descripción"} />
              </div>
            </div>

            {/* Jerarquía y Salario */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader
                title="Jerarquía y Salario"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Nivel Jerárquico</label>
                    <p className="text-sm font-bold text-slate-900">{position.hierarchicalLevel ?? "—"}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Salario Base</label>
                    <p className="text-sm font-bold text-slate-900">
                      {position.baseSalary != null ? `S/. ${position.baseSalary.toFixed(2)}` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sistema */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHeader
                title="Sistema"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Fecha de Creación</label>
                    <p className="text-sm font-semibold text-slate-900">{formatDate(position.createdAt)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Estado</label>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${position.active ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {position.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all flex items-center gap-2">
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

