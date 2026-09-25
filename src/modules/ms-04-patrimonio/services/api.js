import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5000/api/v1')}/assets`;
const SBN_CATALOG_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5000/api/v1')}/assets/sbn-catalog`;

export const getBienesPatrimoniales = async () => {
  const response = await httpClient.get(API_BASE_URL);
  return response.data;
};

export const getBienPatrimonialById = async (id) => {
  const response = await httpClient.get(`${API_BASE_URL}/${id}`);
  return response.data;
};

export const createBienPatrimonial = async (data) => {
  const response = await httpClient.post(API_BASE_URL, data);
  return response.data;
};

export const updateBienPatrimonial = async (id, data) => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteBienPatrimonial = async (id, motivo = 'Bien dado de baja') => {
  return await cambiarEstadoBien(id, 'INACTIVE', motivo);
};

export const restaurarBienPatrimonial = async (id, motivo = 'Bien restaurado') => {
  return await cambiarEstadoBien(id, 'AVAILABLE', motivo);
};

export const deleteBienPatrimonialFisico = async (id) => {
  await httpClient.delete(`${API_BASE_URL}/${id}`);
};

export const cambiarEstadoBien = async (id, nuevoEstado, motivo = '') => {
  const response = await httpClient.patch(`${API_BASE_URL}/${id}/status`, { nuevoEstado, motivo });
  return response.data;
};

export const actualizarBienPatrimonial = async (id, camposAActualizar) => {
  const current = await httpClient.get(`${API_BASE_URL}/${id}`);
  const updatePayload = { ...current.data, ...camposAActualizar };
  const updated = await httpClient.put(`${API_BASE_URL}/${id}`, updatePayload);
  return updated.data;
};

export const getBienesByEstado = async (status) => {
  const response = await httpClient.get(`${API_BASE_URL}/status/${status}`);
  return response.data;
};

export const getBienByCodigo = async (assetCode) => {
  const response = await httpClient.get(`${API_BASE_URL}/codigo/${assetCode}`);
  return response.data;
};

export const validateSBNCode = async (sbnCode, excludeAssetId = null) => {
  try {
    const url = excludeAssetId
      ? `${API_BASE_URL}/validate-sbn/${sbnCode}?excludeAssetId=${excludeAssetId}`
      : `${API_BASE_URL}/validate-sbn/${sbnCode}`;
    const response = await httpClient.get(url);
    return response.data;
  } catch {
    return { exists: false };
  }
};

export const getLastAssetCode = async (sbnCode) => {
  try {
    const response = await httpClient.get(`${API_BASE_URL}/last-code/${sbnCode}`);
    return response.data;
  } catch {
    return '';
  }
};

export const getNextSequence = async (sbnCode) => {
  try {
    const response = await httpClient.get(`${API_BASE_URL}/next-seq/${sbnCode}`);
    return response.data;
  } catch {
    return { sequence: 1, formattedCode: '001', fullAssetCode: `${sbnCode}-001` };
  }
};

export const checkAssetCodeExists = async (assetCode) => {
  try {
    const response = await httpClient.get(`${API_BASE_URL}/codigo/${assetCode}`);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    return false;
  }
};

export const getSbnCatalog = async () => {
  try {
    const response = await httpClient.get(SBN_CATALOG_URL);
    return response.data;
  } catch {
    return null;
  }
};

export const getSbnGrupos = async () => {
  try {
    const response = await httpClient.get(`${SBN_CATALOG_URL}/grupos`);
    return response.data;
  } catch {
    return null;
  }
};

export const getSbnCatalogByGrupo = async (grupo) => {
  try {
    const response = await httpClient.get(`${SBN_CATALOG_URL}/grupo/${encodeURIComponent(grupo)}`);
    return response.data;
  } catch {
    return null;
  }
};

export const getSbnCatalogByCodigo = async (codigo) => {
  try {
    const response = await httpClient.get(`${SBN_CATALOG_URL}/${codigo}`);
    return response.data;
  } catch {
    return null;
  }
};

export const downloadBatchTemplate = async () => {
  const response = await httpClient.get(`${API_BASE_URL}/batch/template`, { responseType: 'blob' });
  return response.data;
};

export const uploadBatchCsv = async (formData) => {
  const response = await httpClient.post(`${API_BASE_URL}/batch/csv`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
