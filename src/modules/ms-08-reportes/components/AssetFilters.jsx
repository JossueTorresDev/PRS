import React, { useState } from 'react';

/**
 * Componente de filtros para activos
 * Permite filtrar por categoría o ubicación
 */
export function AssetFilters({ 
  onCategoryChange,
  onLocationChange,
  onFilterReset,
  loading
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [filterMode, setFilterMode] = useState('none'); // none, category, location

  // Categorías disponibles
  const categories = [
    'INFRASTRUCTURE',
    'IT_EQUIPMENT',
    'FURNITURE',
    'VEHICLES',
    'OTHER',
  ];

  // Ubicaciones comunes (ejemplos)
  const locations = [
    'Office A',
    'Office B',
    'Warehouse',
    'Storage',
    'Meeting Room',
  ];

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedLocation(null);
    setFilterMode('category');
    onCategoryChange?.(category, 0); // Reset a página 0
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setSelectedCategory(null);
    setFilterMode('location');
    onLocationChange?.(location, 0); // Reset a página 0
  };

  const handleReset = () => {
    setSelectedCategory(null);
    setSelectedLocation(null);
    setFilterMode('none');
    onFilterReset?.();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-700 mb-4">Filtros</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro por Categoría */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Categoría
          </label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => handleCategorySelect(e.target.value || null)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            <option value="">-- Todas las categorías --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Ubicación */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Ubicación
          </label>
          <select
            value={selectedLocation || ''}
            onChange={(e) => handleLocationSelect(e.target.value || null)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            <option value="">-- Todas las ubicaciones --</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estado del filtro */}
      {filterMode !== 'none' && (
        <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded p-3">
          <span className="text-sm text-blue-800">
            {filterMode === 'category' && `Filtrado por: ${selectedCategory}`}
            {filterMode === 'location' && `Filtrado por: ${selectedLocation}`}
          </span>
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}

export default AssetFilters;
