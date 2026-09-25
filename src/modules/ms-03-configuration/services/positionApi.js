import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5004')}/positions`;

export const getAllActivePositions = async () => {
  const { data } = await httpClient.get(API_URL);
  return data;
};

export const getAllInactivePositions = async () => {
  const { data } = await httpClient.get(`${API_URL}/inactive`);
  return data;
};

export const createPosition = async (position) => {
  const { data } = await httpClient.post(API_URL, position);
  return data;
};

export const updatePosition = async (id, position) => {
  const { data } = await httpClient.put(`${API_URL}/${id}`, position);
  return data;
};

export const deletePosition = async (id) => {
  await httpClient.delete(`${API_URL}/${id}`);
};

export const restorePosition = async (id) => {
  await httpClient.patch(`${API_URL}/${id}/restore`);
};

export const getNextPositionCode = async (municipalityId) => {
  const { data } = await httpClient.get(`${API_URL}/next-code/${municipalityId}`);
  return data;
};
