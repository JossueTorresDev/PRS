import { useState, useEffect } from 'react';
import {
  getAreas,
  getCategories,
  getLocations,
  getResponsible,
  getSuppliers,
  getSbnCatalogData,
  normalizeAreas,
  normalizeCategories,
  normalizeLocations,
  normalizeResponsible,
  normalizeSuppliers,
} from '../services/configurationService';
import { getMunicipalityId } from '../../../shared/utils/municipalityHelper.js';

/**
 * Hook para cargar datos de configuración con caché automático
 */
export default function useConfigurationData() {
  const [data, setData] = useState({
    areas: [],
    categories: [],
    locations: [],
    responsible: [],
    suppliers: [],
    sbnData: [],
    sbnGrupos: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    // Obtener municipalityId para filtrar datos por municipalidad
    const municipalityId = getMunicipalityId();
    
    // Cargar cada endpoint independientemente - si uno falla, los otros siguen cargando
    const results = await Promise.allSettled([
      getAreas(municipalityId).catch(err => { console.error('Error cargando áreas:', err); return []; }),
      getCategories(municipalityId).catch(err => { console.error('Error cargando categorías:', err); return []; }),
      getLocations(municipalityId).catch(err => { console.error('Error cargando ubicaciones:', err); return []; }),
      getResponsible(municipalityId).catch(err => { console.error('Error cargando responsables:', err); return []; }),
      getSuppliers(municipalityId).catch(err => { console.error('Error cargando proveedores:', err); return []; }),
      getSbnCatalogData().catch(err => { console.error('Error cargando catálogo SBN:', err); return []; }),
    ]);

    const [areas, categories, locations, responsible, suppliers, sbnData] = results.map(r => r.status === 'fulfilled' ? r.value : []);
    const sbnGrupos = [...new Set((Array.isArray(sbnData) ? sbnData : []).map(d => d.grupo).filter(Boolean))];

    setData({
      areas: normalizeAreas(areas),
      categories: normalizeCategories(categories),
      locations: normalizeLocations(locations),
      responsible: normalizeResponsible(responsible),
      suppliers: normalizeSuppliers(suppliers),
      sbnData: Array.isArray(sbnData) ? sbnData : [],
      sbnGrupos,
    });

    // Solo mostrar error si TODOS fallaron
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
      setError('No se pudieron cargar los datos de configuración');
    } else if (results.some(r => r.status === 'rejected')) {
      // Algunos fallaron, mostrar warning en consola pero no bloquear UI
      console.warn('Algunos datos de configuración no pudieron cargarse');
    }

    setLoading(false);
  };

  return { ...data, loading, error, reload: loadData };
}
