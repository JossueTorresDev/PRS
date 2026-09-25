import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/system-configurations`;

export const getAllSystemConfigurations = async () => {
  const { data } = await httpClient.get(API_URL);
  return data;
};

export const createSystemConfiguration = async (config) => {
  const { data } = await httpClient.post(`${API_URL}/create`, config);
  return data;
};

export const updateSystemConfiguration = async (id, config) => {
  const { data } = await httpClient.put(`${API_URL}/update/${id}`, config);
  return data;
};

export const softDeleteSystemConfiguration = async (id) => {
  await httpClient.delete(`${API_URL}/soft-delete/${id}`);
};

export const restoreSystemConfiguration = async (id) => {
  await httpClient.put(`${API_URL}/restore/${id}`);
};
