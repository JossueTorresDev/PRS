import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/areas`;

export const getAllAreas = async () => {
  try {
    const { data } = await httpClient.get(`${BASE_URL}?_=${Date.now()}`);
    return data;
  } catch (err) {
    const msg = err?.message || "Error obteniendo áreas";
    throw new Error(msg);
  }
};

export const getAreaById = async (id) => {
  try {
    const { data } = await httpClient.get(`${BASE_URL}/${id}`);
    return data;
  } catch (err) {
    const msg = err?.message || "Error obteniendo área";
    throw new Error(msg);
  }
};

export const getInactiveAreas = async () => {
  try {
    const { data } = await httpClient.get(`${BASE_URL}/inactive?_=${Date.now()}`);
    return data;
  } catch (err) {
    const msg = err?.message || "Error obteniendo áreas inactivas";
    throw new Error(msg);
  }
};

export const createArea = async (payload) => {
  try {
    const { data } = await httpClient.post(BASE_URL, payload);
    return data;
  } catch (err) {
    const msg = err?.message || "Error creando área";
    throw new Error(msg);
  }
};

export const updateArea = async (id, payload) => {
  try {
    const { data } = await httpClient.put(`${BASE_URL}/${id}`, payload);
    return data;
  } catch (err) {
    const msg = err?.message || "Error actualizando área";
    throw new Error(msg);
  }
};

export const deleteArea = async (id) => {
  try {
    await httpClient.delete(`${BASE_URL}/inactive/${id}`);
  } catch (err) {
    const msg = err?.message || "Error eliminando área";
    throw new Error(msg);
  } finally {
    try { sessionStorage.removeItem('areas_cache'); } catch {}
  }
};

export const restoreArea = async (id) => {
  try {
    await httpClient.patch(`${BASE_URL}/restore/${id}`);
  } catch (err) {
    const msg = err?.message || "Error restaurando área";
    throw new Error(msg);
  } finally {
    try { sessionStorage.removeItem('areas_cache'); } catch {}
  }
};
