import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/physical-locations`;

export const getAllPhysicalLocations = async () => {
  try {
    const { data } = await httpClient.get(BASE_URL);
    return data;
  } catch (err) {
    const msg = err?.message || "Error obteniendo ubicaciones fisicas";
    throw new Error(msg);
  }
};

export const getPhysicalLocationById = async (id) => {
  try {
    const { data } = await httpClient.get(`${BASE_URL}/${id}`);
    return data;
  } catch (err) {
    const msg = err?.message || "Error obteniendo ubicación física";
    throw new Error(msg);
  }
};

export const createPhysicalLocation = async (payload) => {
  try {
    const { data } = await httpClient.post(BASE_URL, payload);
    return data;
  } catch (err) {
    const msg = err?.message || "Error creando ubicación física";
    throw new Error(msg);
  }
};

export const updatePhysicalLocation = async (id, payload) => {
  try {
    const { data } = await httpClient.put(`${BASE_URL}/${id}`, payload);
    return data;
  } catch (err) {
    const msg = err?.message || "Error actualizando ubicación física";
    throw new Error(msg);
  }
};

export const deletePhysicalLocation = async (id) => {
  try {
    try { await httpClient.delete(`${BASE_URL}/inactive/${id}`); return; }
    catch (e1) {
      if (e1?.status === 404 || e1?.status === 405) {
        try { await httpClient.delete(`${BASE_URL}/${id}`); return; }
        catch { /* continue */ }
      }
      try { await httpClient.put(`${BASE_URL}/update/${id}`, { active: false }); return; }
      catch { /* continue */ }
      try { await httpClient.put(`${BASE_URL}/${id}`, { active: false }); return; }
      catch { /* continue */ }
      throw e1;
    }
  } catch (err) {
    const msg = err?.message || "Error eliminando ubicación física";
    throw new Error(msg);
  }
};

export const getInactivePhysicalLocations = async () => {
  try {
    const { data } = await httpClient.get(`${BASE_URL}/inactive`);
    return data;
  } catch (e1) {
    if (e1?.status === 404) return [];
    const msg = e1?.message || "Error obteniendo ubicaciones inactivas";
    throw new Error(msg);
  }
};

export const restorePhysicalLocation = async (id) => {
  try {
    await httpClient.patch(`${BASE_URL}/restore/${id}`);
  } catch (err) {
    const msg = err?.message || "Error restaurando ubicación física";
    throw new Error(msg);
  }
};
