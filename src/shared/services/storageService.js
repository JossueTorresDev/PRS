import { getEnv } from '../utils/env.js';
import httpClient from './httpClient.js';

const STORAGE_API_URL = `${getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5000/api/v1')}/storage`;

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await httpClient.post(`${STORAGE_API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      success: true,
      url: response.data.url,
      fileName: response.data.fileName,
      originalName: response.data.originalName,
    };
  } catch (error) {
    return { success: false, error: error.message || 'Error de red al subir archivo' };
  }
};

export const uploadMultipleFiles = async (files) => {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await httpClient.post(`${STORAGE_API_URL}/upload-multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, files: response.data };
  } catch (error) {
    return { success: false, error: error.message || 'Error de red al subir archivos' };
  }
};

export const deleteFile = async (fileName) => {
  try {
    await httpClient.delete(`${STORAGE_API_URL}/${encodeURIComponent(fileName)}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || `Error ${error.status}` };
  }
};

export const getFileUrl = async (fileName) => {
  try {
    const response = await httpClient.get(`${STORAGE_API_URL}/url/${encodeURIComponent(fileName)}`);
    return { success: true, url: response.data.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getFileInfo = async (fileName) => {
  try {
    const response = await httpClient.get(`${STORAGE_API_URL}/info/${encodeURIComponent(fileName)}`);
    return { success: true, info: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
