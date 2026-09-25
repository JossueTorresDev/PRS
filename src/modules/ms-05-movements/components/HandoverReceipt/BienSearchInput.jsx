/**
 * Componente de selección de bienes con dropdown
 * Muestra bienes disponibles (excluye los ya seleccionados)
 * Se agrega automáticamente al seleccionar
 * 
 * FLUJO:
 * 1. Al editar: bienes guardados NO aparecen en dropdown
 * 2. Si eliminas un bien: desaparece de la tabla y reaparece en dropdown
 * 3. Puedes volver a agregarlo sin duplicados
 */
export default function BienSearchInput({ 
  bienes = [], 
  selectedBienId = '', 
  onSelectBien, 
  onSearchChange,
  selectedBienes = []
}) {
  // Normalizar IDs para comparación robusta
  const normalizeId = (id) => String(id || '').trim().toLowerCase();
  
  // Crear clave única para un bien
  const getBienKey = (bien) => {
    if (!bien) return '';
    // Prioridad: code > id > assetCode (porque code es más consistente)
    const code = normalizeId(bien.code || bien.assetCode || '');
    const id = normalizeId(bien.id || bien.assetId || '');
    // Usar code si existe, sino id, sino retornar vacío
    const key = code || id;
    return key;
  };
  
  // Crear set de claves de bienes seleccionados
  // Se recalcula automáticamente cuando selectedBienes cambia
  const selectedBienKeys = new Set(
    selectedBienes
      .map(b => getBienKey(b))
      .filter(key => key) // Filtrar claves vacías
  );
  
  // Filtrar bienes disponibles (no seleccionados)
  // Si eliminas un bien de selectedBienes, automáticamente reaparece aquí
  const availableBienes = bienes.filter(bien => {
    const bienKey = getBienKey(bien);
    return bienKey && !selectedBienKeys.has(bienKey);
  });

  const handleSelectChange = (e) => {
    const bienId = e.target.value;
    
    if (bienId) {
      // Buscar el bien seleccionado comparando por cualquier identificador
      const selectedBien = bienes.find(b => {
        const normalizedBienId = normalizeId(bienId);
        // Comparar por id, code, o assetCode
        return (
          normalizeId(b.id || b.assetId || '') === normalizedBienId ||
          normalizeId(b.code || b.assetCode || '') === normalizedBienId
        );
      });
      
      if (selectedBien) {
        // Validar que no esté duplicado usando getBienKey
        const selectedKey = getBienKey(selectedBien);
        const isDuplicate = selectedBienKeys.has(selectedKey);
        
        if (!isDuplicate) {
          onSelectBien(selectedBien);
          // Resetear el dropdown inmediatamente
          onSearchChange('');
        }
      }
    }
  };

  return (
    <div className="flex gap-3">
      {/* Dropdown de bienes - SIN botón */}
      <div className="flex-1 relative">
        <select
          value={selectedBienId || ''}
          onChange={handleSelectChange}
          disabled={availableBienes.length === 0}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors duration-200 appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {availableBienes.length === 0 ? 'Todos los bienes están seleccionados' : 'Seleccionar bien patrimonial...'}
          </option>
          {availableBienes.map(bien => {
            const displayId = bien.id || bien.code || bien.assetCode;
            return (
              <option key={normalizeId(displayId)} value={displayId}>
                {bien.code || bien.assetCode || bien.id} - {bien.description || bien.assetDescription || bien.name || 'Sin descripción'}
              </option>
            );
          })}
        </select>
        <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
}
