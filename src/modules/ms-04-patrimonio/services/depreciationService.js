import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5003/api/v1')}/assets-depreciations`;

export const getDepreciationHistoryByAsset = async (assetId) => {
  const { data } = await httpClient.get(`${API_URL}/${assetId}`);
  return data;
};

export const calculateDepreciation = async (assetId) => {
  const { data } = await httpClient.get(`${API_URL}/calculate/${assetId}`);
  return data;
};

export const generateAndFetchDepreciations = async (assetId, params) => {
  await httpClient.get(`${API_URL}/auto/${assetId}`, { params });
  const { data } = await httpClient.get(`${API_URL}/${assetId}`);
  return data;
};
