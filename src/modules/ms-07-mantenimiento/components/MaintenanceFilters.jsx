export default function MaintenanceFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  priorityFilter,
  onPriorityChange,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
          Buscar
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Código, activo o responsable..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
          Estado
        </label>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          >
            <option value="">Estado: Todos</option>
            <option value="SCHEDULED">Programados</option>
            <option value="IN_PROCESS">En Proceso</option>
            <option value="PENDING_CONFORMITY">Conformidad</option>
            <option value="CONFIRMED">Finalizados</option>
            <option value="SUSPENDED">Pausados</option>
            <option value="CANCELLED">Anulados</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
          Categoría
        </label>
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          >
            <option value="">Categoría: Todas</option>
            <option value="PREVENTIVE">Preventivo</option>
            <option value="CORRECTIVE">Correctivo</option>
            <option value="PREDICTIVE">Predictivo</option>
            <option value="EMERGENCY">Emergencia</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
          Prioridad
        </label>
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-slate-900 font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
          >
            <option value="">Prioridad: Cualquiera</option>
            <option value="LOW">Nivel Bajo</option>
            <option value="MEDIUM">Nivel Medio</option>
            <option value="HIGH">Nivel Alto</option>
            <option value="CRITICAL">Nivel Crítico</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
