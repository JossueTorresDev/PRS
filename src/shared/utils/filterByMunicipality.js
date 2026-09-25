/**
 * Función genérica para filtrar datos por municipalityId
 * Funciona con cualquier módulo: patrimonio, movimientos, inventario, etc.
 * 
 * USO:
 * import { filterByMunicipality } from '../../../../shared/utils/filterByMunicipality';
 * const filtered = filterByMunicipality(data, municipalityId);
 * const filtered = filterByMunicipality(data, municipalityId, 'municipioId');
 */

/**
 * Filtra un array de datos por municipalityId del usuario autenticado
 * Genérica: funciona con assets, disposals, usuarios, movimientos, inventario, etc.
 * 
 * @param {Array} data - Array de objetos a filtrar
 * @param {string|null} municipalityId - ID de la municipalidad (extraído del token JWT)
 * @param {string} fieldName - Nombre del campo que contiene municipalityId (default: 'municipalityId')
 * @returns {Array} Datos filtrados o array completo si municipalityId es null
 * 
 * @example
 * const filtered = filterByMunicipality(assets, 'mun-123');
 * 
 * @example
 * const filtered = filterByMunicipality(data, 'mun-123', 'municipioId');
 * 
 * @example
 * const filtered = filterByMunicipality(data, null);
 */
export const filterByMunicipality = (data = [], municipalityId, fieldName = 'municipalityId') => {
  if (!Array.isArray(data)) {
    console.warn('🔀 filterByMunicipality FAILED: data no es un array', {
      dataType: typeof data,
      data
    });
    return [];
  }

  if (!municipalityId) {
    console.debug('🔀 filterByMunicipality SKIPPED: sin municipalityId, retornando todos los datos', {
      dataLength: data.length
    });
    return data;
  }

  console.log(`🔀 filterByMunicipality STARTING FILTER:`, {
    fieldName,
    municipalityId,
    dataCount: data.length,
    dataItems: data.map(item => ({
      id: item.id || item.codigoUbicacion || 'no-id',
      [fieldName]: item[fieldName],
      name: item.name || item.label || item.nombre,
      allKeys: Object.keys(item)
    }))
  });

  const filtered = data.filter(item => {
    const itemValue = item[fieldName];
    const include = !itemValue || itemValue === municipalityId;
    console.log(`  🔷 Filtering item: "${item.name || item.label || 'unnamed'}" - ${fieldName}="${itemValue}" vs municipalityId="${municipalityId}" => include=${include}`);
    return include;
  });

  console.log(`✅ filterByMunicipality RESULT:`, {
    included: filtered.length,
    fromTotal: data.length,
    filteredItems: filtered.map(item => ({
      id: item.id || item.codigoUbicacion || 'no-id',
      [fieldName]: item[fieldName],
      name: item.name || item.label || item.nombre,
      completeItem: item
    }))
  });

  return filtered;
};

/**
 * Versión alternativa para casos donde el municipalityId está en múltiples campos posibles
 * Útil cuando datos vienen con nomenclatura inconsistente
 * 
 * @param {Array} data - Array de objetos a filtrar
 * @param {string|null} municipalityId - ID de la municipalidad
 * @param {Array<string>} fieldNames - Array de posibles nombres del campo (orden importa)
 * @returns {Array} Datos filtrados
 * 
 * @example
 * const filtered = filterByMunicipalityMultiField(
 *   data,
 *   'mun-123',
 *   ['municipalityId', 'municipioId', 'municipality_id']
 * );
 */
export const filterByMunicipalityMultiField = (
  data = [],
  municipalityId,
  fieldNames = ['municipalityId', 'municipioId', 'municipality_id']
) => {
  if (!Array.isArray(data)) {
    console.warn('filterByMunicipalityMultiField: data no es un array', data);
    return [];
  }

  if (!municipalityId) {
    return data;
  }

  const filtered = data.filter(item => {
    for (const fieldName of fieldNames) {
      const itemValue = item[fieldName];
      if (itemValue === municipalityId) {
        return true;
      }
    }
    return !fieldNames.some(field => item[field]);
  });

  console.debug(`filterByMunicipalityMultiField: filtrados ${filtered.length}/${data.length} items`);
  return filtered;
};
