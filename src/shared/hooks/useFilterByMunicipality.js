import { useEffect, useState, useMemo } from 'react';
import { getMunicipalityId } from '../utils/municipalityHelper';
import { filterByMunicipality, filterByMunicipalityMultiField } from '../utils/filterByMunicipality';

/**
 * Hook que filtra datos por municipalidad automáticamente
 * Encapsula la lógica de obtener municipalityId + filtrar
 * 
 * import { useFilterByMunicipality } from '../../../../shared/hooks/useFilterByMunicipality';
 * const filteredBienes = useFilterByMunicipality(bienes);
 * const filteredData = useFilterByMunicipality(data, 'municipioId');
 * const filteredData = useFilterByMunicipality(data, null, ['municipalityId', 'municipioId']);
 */

/**
 * Hook que filtra datos por municipalidad del usuario autenticado
 * Se re-ejecuta automáticamente cuando data o municipalityId cambian
 * 
 * @param {Array} data - Datos a filtrar
 * @param {string|null} fieldName - Nombre del campo municipalityId (default: 'municipalityId')
 * @param {Array<string>|null} multiFields - Para búsqueda en múltiples campos (null = sin multi)
 * @returns {Array} Datos filtrados
 * 
 * @example
 * const bienes = useFilterByMunicipality(dataFromAPI);
 * 
 * @example
 * const movimientos = useFilterByMunicipality(data, 'municipioId');
 * 
 * @example
 * const inventario = useFilterByMunicipality(data, null, ['municipalityId', 'municipioId']);
 */
export const useFilterByMunicipality = (
  data,
  fieldName = 'municipalityId',
  multiFields = null
) => {
  const municipalityId = getMunicipalityId();
  const [filteredData, setFilteredData] = useState([]);

  // Usar useMemo para no recalcular si los datos no cambian
  const memoizedFiltered = useMemo(() => {
    console.log(`🪝 useFilterByMunicipality hook - COMPUTING MEMOIZED:`, {
      municipalityId,
      fieldName,
      dataInput: data,
      dataCount: Array.isArray(data) ? data.length : 'not an array',
      dataType: typeof data
    });
    
    if (multiFields && Array.isArray(multiFields)) {
      const result = filterByMunicipalityMultiField(data, municipalityId, multiFields);
      console.log(`🎨 useFilterByMunicipality multi-field result count: ${result.length}`);
      return result;
    }
    const result = filterByMunicipality(data, municipalityId, fieldName);
    console.log(`🎨 useFilterByMunicipality single-field result count: ${result.length}`);
    return result;
  }, [data, municipalityId, fieldName, multiFields]);

  // Actualizar estado cuando se recalcula
  useEffect(() => {
    console.log(`🎯 useFilterByMunicipality useEffect - SETTING STATE:`, {
      inputCount: Array.isArray(data) ? data.length : 0,
      memoizedCount: memoizedFiltered.length,
      memoizedFiltered: memoizedFiltered,
      willSetStateTo: memoizedFiltered
    });
    setFilteredData(memoizedFiltered);
  }, [memoizedFiltered]);

  console.log(`✅ useFilterByMunicipality RETURNING filteredData:`, {
    count: filteredData.length,
    data: filteredData,
    stateType: typeof filteredData
  });

  return filteredData;
};

/**
 * Hook: retorna el municipalityId para usar en lógica personalizada
 * Útil si necesitas el ID pero no quieres usar el hook de filtrado
 * 
 * @returns {string|null} ID de la municipalidad actual
 * 
 * @example
 * const municipalityId = useMunicipalityIdContext();
 */
export const useMunicipalityIdContext = () => {
  return getMunicipalityId();
};
