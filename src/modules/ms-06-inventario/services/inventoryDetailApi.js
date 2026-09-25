import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from "../../../shared/utils/env.js";

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL', '')}/inventory-details`;

export const getAllInventoryDetails = async () => {
  const { data } = await httpClient.get(API_BASE_URL);
  return data;
};

export const getDetailsByInventoryId = async (inventoryId) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/by-inventory/${inventoryId}`);
  return data;
};

export const createInventoryDetail = async (detailData) => {
  const response = await httpClient.post(API_BASE_URL, detailData);
  return response.data;
};

export const updateInventoryDetail = async (id, detailData) => {
  const response = await httpClient.put(`${API_BASE_URL}/${id}`, detailData);
  return response.data;
};

export const deleteInventoryDetail = async (id) => {
  await httpClient.delete(`${API_BASE_URL}/${id}`);
  return true;
};
