import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/categories-assets`;

export const getAllCategories = async () => {
  const { data } = await httpClient.get(API_URL);
  return data;
};

export const getAllActiveCategories = async () => {
  const { data } = await httpClient.get(`${API_URL}/active`);
  return data;
};

export const getAllInactiveCategories = async () => {
  const { data } = await httpClient.get(`${API_URL}/inactive`);
  return data;
};

export const createCategory = async (category) => {
  const { data } = await httpClient.post(`${API_URL}/create`, category);
  return data;
};

export const updateCategory = async (id, category) => {
  const { data } = await httpClient.put(`${API_URL}/update/${id}`, category);
  return data;
};

export const deleteCategory = async (id) => {
  await httpClient.delete(`${API_URL}/inactive/${id}`);
};

export const restoreCategory = async (id) => {
  await httpClient.patch(`${API_URL}/restore/${id}`);
};
