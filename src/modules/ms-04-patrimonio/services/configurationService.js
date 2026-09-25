import { getMunicipalityId } from '../../../shared/utils/municipalityHelper.js';

// Importar servicios específicos de cada módulo
import { getAllAreas } from '../../ms-03-configuration/services/areasApi.js';
import { getAllCategories } from '../../ms-03-configuration/services/apiCategory.js';
import { getAllPhysicalLocations } from '../../ms-03-configuration/services/physicalLocationApi.js';
import { getProveedores } from '../../ms-03-configuration/services/api.js';
import { getSbnCatalog } from './api.js';

// Servicios de auth para responsables (persons)
import personService from '../../ms-02-authentication/services/personService.js';

// API endpoints - usando servicios específicos de cada módulo

// Áreas desde módulo de configuración
export const getAreas = async (municipalityId) => {
  try {
    const data = await getAllAreas();
    // Filtrar por municipalityId si se proporciona
    if (municipalityId && Array.isArray(data)) {
      return data.filter(area => !area.municipalityId || area.municipalityId === municipalityId);
    }
    return data;
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    throw error;
  }
};

// Categorías desde módulo de configuración
export const getCategories = async (municipalityId) => {
  try {
    const data = await getAllCategories();
    // Filtrar por municipalityId si se proporciona
    if (municipalityId && Array.isArray(data)) {
      return data.filter(cat => !cat.municipalityId || cat.municipalityId === municipalityId);
    }
    return data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

// Ubicaciones desde módulo de configuración
// No filtramos por municipio aquí porque el catálogo de ubicaciones físicas
// se comparte tal como lo consume el módulo de configuración.
export const getLocations = async () => {
  try {
    const data = await getAllPhysicalLocations();
    return data;
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    throw error;
  }
};

// Responsables desde módulo de auth (persons)
export const getResponsible = async (municipalityId) => {
  try {
    const data = await personService.getAllPersons();
    // Filtrar por municipalityId si se proporciona
    if (municipalityId && Array.isArray(data)) {
      return data.filter(person => !person.municipalityId || person.municipalityId === municipalityId);
    }
    return data;
  } catch (error) {
    console.error('Error al obtener responsables:', error);
    throw error;
  }
};

// Proveedores desde módulo de configuración
export const getSuppliers = async (municipalityId) => {
  try {
    const data = await getProveedores();
    // Filtrar por municipalityId si se proporciona
    if (municipalityId && Array.isArray(data)) {
      return data.filter(sup => !sup.municipalityId || sup.municipalityId === municipalityId);
    }
    return data;
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
};

// Funciones de normalización
const normalize = (items, nameField, codeField) => {
  if (!Array.isArray(items)) {
    console.warn('items no es un array:', items);
    return [];
  }

  return items.map(item => ({
    id: item.id,
    label: item[nameField] || 'Sin nombre',
    code: item[codeField] || 'Sin código',
    raw: item
  }));
};

export const normalizeAreas = (data) => normalize(data, 'name', 'areaCode');
export const normalizeCategories = (data) => normalize(data, 'name', 'categoryCode');
export const normalizeLocations = (data) => normalize(data, 'name', 'locationCode');

export const normalizeResponsible = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    id: item.id,
    label: `${item.firstName || ''} ${item.lastName || ''}`.trim() || '',
    code: item.employeeCode || '',
    raw: item
  }));
};

export const normalizeSuppliers = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    id: item.id,
    label: item.tradeName || item.legalName || '',
    code: item.codigoProveedor || '',
    raw: item
  }));
};

export const getSbnCatalogData = async () => {
  try {
    const data = await getSbnCatalog();
    return data;
  } catch (error) {
    console.error('Error al obtener catálogo SBN:', error);
    throw error;
  }
};

export const reloadConfigurationData = async (municipalityId) => {
  const muniId = municipalityId || getMunicipalityId();
  try {
    const [areas, categories, locations, responsible, suppliers] = await Promise.all([
      getAreas(muniId),
      getCategories(muniId),
      getLocations(muniId),
      getResponsible(muniId),
      getSuppliers(muniId)
    ]);

    return {
      areas,
      categories,
      locations,
      responsible,
      suppliers
    };
  } catch (error) {
    console.error('Error al recargar datos de configuración:', error);
    throw error;
  }
};