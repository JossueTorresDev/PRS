import { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  CalendarIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  MovementTypeLabels,
  MovementStatus,
  MovementStatusLabels,
  getMovementTypeSelectOptions,
} from '../../types/movementTypes';
export default function MovementFilters({ 
  onFilterChange, 
  areas = [], 
  locations = [], 
  persons = [],
  activeFilters = {}
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchText: '',
    status: '',
    type: '',
    startDate: '',
    endDate: '',
    originAreaId: '',
    destinationAreaId: '',
    originLocationId: '',
    destinationLocationId: '',
    responsibleId: '',
    ...activeFilters
  });
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  const clearFilters = () => {
    const emptyFilters = {
      searchText: '',
      status: '',
      type: '',
      startDate: '',
      endDate: '',
      originAreaId: '',
      destinationAreaId: '',
      originLocationId: '',
      destinationLocationId: '',
      responsibleId: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de movimiento..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>
        {}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
            showAdvancedFilters
              ? 'bg-slate-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          Filtros Avanzados
          {hasActiveFilters && !showAdvancedFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {Object.values(filters).filter(v => v !== '').length}
            </span>
          )}
        </button>
        {}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
            Limpiar
          </button>
        )}
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(MovementStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Movimiento</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Todos los tipos</option>
            {getMovementTypeSelectOptions({ context: 'module' }).map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha desde</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>
      {}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FunnelIcon className="h-4 w-4" />
            Filtros Avanzados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Fecha hasta
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <BuildingOffice2Icon className="h-3 w-3" />
                Área Origen
              </label>
              <select
                value={filters.originAreaId}
                onChange={(e) => handleFilterChange('originAreaId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Todas las áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.areaCode ? `${area.areaCode} - ` : ''}{area.name}
                  </option>
                ))}
              </select>
            </div>
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <BuildingOffice2Icon className="h-3 w-3" />
                Área Destino
              </label>
              <select
                value={filters.destinationAreaId}
                onChange={(e) => handleFilterChange('destinationAreaId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Todas las áreas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.areaCode ? `${area.areaCode} - ` : ''}{area.name}
                  </option>
                ))}
              </select>
            </div>
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                Ubicación Origen
              </label>
              <select
                value={filters.originLocationId}
                onChange={(e) => handleFilterChange('originLocationId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.locationCode ? `${location.locationCode} - ` : ''}{location.name}
                  </option>
                ))}
              </select>
            </div>
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                Ubicación Destino
              </label>
              <select
                value={filters.destinationLocationId}
                onChange={(e) => handleFilterChange('destinationLocationId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Todas las ubicaciones</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.locationCode ? `${location.locationCode} - ` : ''}{location.name}
                  </option>
                ))}
              </select>
            </div>
            {}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                Responsable
              </label>
              <select
                value={filters.responsibleId}
                onChange={(e) => handleFilterChange('responsibleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Todos los responsables</option>
                {persons.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.firstName} {person.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-600">Filtros activos:</span>
            {filters.searchText && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Búsqueda: "{filters.searchText}"
                <button onClick={() => handleFilterChange('searchText', '')} className="hover:text-blue-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Estado: {MovementStatusLabels[filters.status]}
                <button onClick={() => handleFilterChange('status', '')} className="hover:text-green-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Tipo: {MovementTypeLabels[filters.type]}
                <button onClick={() => handleFilterChange('type', '')} className="hover:text-purple-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                Desde: {filters.startDate}
                <button onClick={() => handleFilterChange('startDate', '')} className="hover:text-amber-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                Hasta: {filters.endDate}
                <button onClick={() => handleFilterChange('endDate', '')} className="hover:text-amber-900">
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
