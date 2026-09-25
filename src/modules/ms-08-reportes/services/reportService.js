import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const GATEWAY_URL = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5000/api/v1');

async function request(endpoint) {
  const base = String(GATEWAY_URL).replace(/\/$/, '');
  const path = String(endpoint).replace(/^\//, '');
  const { data } = await httpClient.get(`${base}/${path}`);
  return data;
}

export const fetchAssets = () => request('/assets');
export const fetchAssetsByStatus = (status) => request(`/assets/status/${status}`);
export const fetchDisposals = () => request('/asset-disposals');
export const fetchMovements = () => request('/asset-movements');
export const fetchInventories = () => request('/inventories');
export const fetchMaintenances = (municipalityId) => {
  const params = municipalityId ? `?municipalityId=${municipalityId}` : '';
  return request(`/maintenances${params}`);
};
export const fetchCategories = () => request('/categories-assets');
export const fetchLocations = () => request('/physical-locations');

export function exportToCSV(data, filename = 'reporte.csv') {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportToExcel(data, filename = 'reporte.xlsx') {
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
