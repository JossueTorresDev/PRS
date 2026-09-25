import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';
import { getMunicipalityId } from '../../../shared/utils/municipalityHelper.js';

const INVENTORY_API_BASE = getEnv('VITE_GATEWAY_API_URL', '');
const API_BASE_URL = `${INVENTORY_API_BASE}/inventories`;
const API_DETAILS_URL = `${INVENTORY_API_BASE}/inventory-details`;

export const getMunicipalityIdFromSession = () => {
  return getMunicipalityId() || (() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      return user?.municipalityId || user?.municipality_id || user?.municipalCode || null;
    } catch {
      return null;
    }
  })();
};

export const getAllInventories = async () => {
  const response = await httpClient.get(`${API_BASE_URL}/with-details`);
  return response.data;
};

export const getAllInventoriesByMunicipality = async (municipalityId) => {
  try {
    if (!municipalityId) {
      return await getAllInventories();
    }
    const response = await httpClient.get(`${API_BASE_URL}/municipality/${municipalityId}/with-details`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.status === 404) return [];
    return [];
  }
};

export const getInventoryById = async (id) => {
  const response = await httpClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createInventory = async (data) => {
  const response = await httpClient.post(API_BASE_URL, data);
  return response.data;
};

export const updateInventory = async (id, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteInventory = async (id, userId) => {
  const response = await httpClient.delete(`${API_BASE_URL}/${id}`, { params: { userId } });
  return response.data;
};

export const startInventory = async (id, userId) => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}/start`, null, { params: { userId } });
  return response.data;
};

export const completeInventory = async (id, userId) => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}/complete`, null, { params: { userId } });
  return response.data;
};

export const getDetailsByInventoryId = async (inventoryId) => {
  const response = await httpClient.get(`${API_DETAILS_URL}/by-inventory/${inventoryId}`);
  return response.data;
};

export const createDetail = async (data) => {
  const response = await httpClient.post(API_DETAILS_URL, data);
  return response.data;
};

export const updateDetail = async (id, data) => {
  const response = await httpClient.put(`${API_DETAILS_URL}/${id}`, data);
  return response.data;
};

export const deleteDetail = async (id) => {
  await httpClient.delete(`${API_DETAILS_URL}/${id}`);
};

export const getAreas = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/areas`);
    return Array.isArray(response.data) ? response.data.filter(a => a.active !== false) : [];
  } catch {
    return [];
  }
};

export const getCategories = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/categories-assets`);
    return Array.isArray(response.data) ? response.data.filter(c => c.active !== false) : [];
  } catch {
    return [];
  }
};

export const getPhysicalLocations = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/physical-locations`);
    return Array.isArray(response.data) ? response.data.filter(l => l.active !== false) : [];
  } catch {
    return [];
  }
};

export const getPersons = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/persons/active`);
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    try {
      const fallback = await httpClient.get(`${INVENTORY_API_BASE}/persons`);
      return Array.isArray(fallback.data) ? fallback.data.filter(p => p.active !== false && p.status !== false) : [];
    } catch {
      return [];
    }
  }
};

export const getUsers = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/users`);
    return Array.isArray(response.data) ? response.data.filter(u => u.active !== false) : [];
  } catch {
    return [];
  }
};

export const getAssets = async () => {
  try {
    const response = await httpClient.get(`${INVENTORY_API_BASE}/assets`);
    return response.data;
  } catch {
    return [];
  }
};
