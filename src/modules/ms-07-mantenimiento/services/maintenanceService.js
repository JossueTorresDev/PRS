import axios from 'axios';
import { getEnv } from '../../../shared/utils/env';
import { formatApiValidationErrors } from '../utils/maintenanceMapper';
import { getAuthHandlers } from '../../../shared/services/httpClient';

const auth = {
  getToken: () => sessionStorage.getItem('accessToken'),
  getSessionUser: () => {
    try {
      const raw = sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
};

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

async function handle401(error, instance) {
  const originalRequest = error.config;
  if (!originalRequest || originalRequest._retry2) return Promise.reject(error);
  if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
    return Promise.reject(error);
  }

  const handlers = getAuthHandlers();
  if (!handlers.refreshToken) return Promise.reject(error);

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(token => {
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return instance(originalRequest);
    });
  }

  originalRequest._retry2 = true;
  isRefreshing = true;

  try {
    const result = await handlers.refreshToken();
    const newToken = result?.token || auth.getToken();
    processQueue(null, newToken);
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return instance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    try {
      if (handlers.logout) await handlers.logout();
    } catch (logoutError) {
      console.warn('[maintenanceService] logout after refresh failure failed:', logoutError);
    }
    const basePath = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/';
    window.location.href = `${basePath}login`;
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

function createHttp(baseURL, { handleValidation = false } = {}) {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = auth.getToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const user = auth.getSessionUser();
      if (user?.municipalCode && !config.headers['X-Municipal-Code']) {
        config.headers['X-Municipal-Code'] = user.municipalCode;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const config = error.config;

      if (error.response?.status === 401) {
        return handle401(error, instance);
      }

      const canRetry = config?.method?.toLowerCase() === 'get';
      if (!error.response && canRetry && !config._retried) {
        config._retried = true;
        return instance(config);
      }

      if (error.response) {
        const { status, data } = error.response;

        if (status === 400 && handleValidation) {
          const rawErrors = data?.validationErrors || data?.errors || data?.fieldErrors;
          if (rawErrors) {
            const detail = formatApiValidationErrors(rawErrors);
            const validationError = new Error(
              detail || 'Se detectaron errores en la validación de los datos.'
            );
            validationError.validationErrors = rawErrors;
            return Promise.reject(validationError);
          }
        }

        const messages = {
          401: 'Su sesión ha expirado. Por favor, vuelva a ingresar.',
          403: 'No tiene permisos para realizar esta acción.',
          404: 'El recurso solicitado no existe.',
          409: 'Conflicto: El registro ya existe o el estado actual no permite esta operación.',
          500: 'Error interno en el servidor municipal. Reintente en unos momentos.',
        };

        const detail =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.details) ? data.details.join('. ') : null) ||
          (typeof data?.details === 'string' ? data.details : null);

        return Promise.reject(
          new Error(messages[status] || detail || `Error del servidor (${status})`)
        );
      }

      if (error.request) {
        return Promise.reject(new Error('No se pudo conectar con el servidor. Revise su conexión de red.'));
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

const http = createHttp(`${getEnv('VITE_GATEWAY_API_URL')}/maintenances`, { handleValidation: true });
const httpGateway = createHttp(`${getEnv('VITE_GATEWAY_API_URL')}`);

const maintenanceService = {
  getAll(municipalityId, page = 0, size = 10, filters = {}, signal) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 10;
    const params = { municipalityId, page: p, size: s };
    Object.keys(params).forEach(key => params[key] == null && delete params[key]);
    if (filters.type) params.type = filters.type;
    if (filters.priority) params.priority = filters.priority;
    if (filters.search) params.search = filters.search;
    if (filters.status) {
      return http.get('/status', { params: { ...params, status: filters.status }, signal });
    }
    return http.get('', { params, signal });
  },

  getById(id, signal) { return http.get(`/${id}`, { signal }); },
  create(data) { return http.post('', data); },
  update(id, data) { return http.put(`/${id}`, data); },

  getByStatus(status, municipalityId, page = 0, size = 10, signal) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 10;
    return http.get('/status', { params: { status, municipalityId, page: p, size: s }, signal });
  },

  startMaintenance(id, body) { return http.post(`/${id}/start`, body); },
  completeMaintenance(id, body) { return http.post(`/${id}/complete`, body); },
  confirmMaintenance(id, body) { return http.post(`/${id}/confirm`, body); },
  suspendMaintenance(id, body) { return http.post(`/${id}/suspend`, body); },
  cancelMaintenance(id, body) { return http.post(`/${id}/cancel`, body); },
  rescheduleMaintenance(id, body) { return http.post(`/${id}/reschedule`, body); },

  addPart(maintenanceId, partData) { return http.post(`/${maintenanceId}/parts`, partData); },

  getParts(maintenanceId, page = 0, size = 10, signal) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 10;
    return http.get(`/${maintenanceId}/parts`, { params: { page: p, size: s }, signal });
  },

  getHistory(maintenanceId, page = 0, size = 10, signal) {
    const p = parseInt(page) || 0;
    const s = parseInt(size) || 10;
    return http.get(`/${maintenanceId}/history`, { params: { page: p, size: s }, signal });
  },

  getConformity(maintenanceId, signal) { return http.get(`/${maintenanceId}/conformity`, { signal }); },

  getAllAssets(municipalityId) {
    const params = municipalityId ? { municipalityId } : {};
    return httpGateway.get('/assets', { params });
  },

  getAssetDetails(assetId, signal) { return httpGateway.get(`/assets/${assetId}`, { signal }); },
  getSupplierDetails(supplierId) { return httpGateway.get(`/suppliers/${supplierId}`); },
  getMunicipalityDetails(municipalCode) { return httpGateway.get(`/tenant/municipalities/${municipalCode}`); },

  uploadMaintenanceDocument(maintenanceId, documentData) {
    return http.post(`/${maintenanceId}/documents`, documentData);
  },

  getMaintenanceDocuments(maintenanceId, signal) {
    return http.get(`/${maintenanceId}/documents`, { signal });
  },
};

export default maintenanceService;
