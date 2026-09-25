import axios from 'axios';
import { getEnv } from '../utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

let authHandlers = {
  refreshToken: null,
  logout: null,
  getToken: () => sessionStorage.getItem('accessToken'),
  getSessionUser: () => {
    try {
      const raw = sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export function setAuthHandlers(handlers) {
  authHandlers = { ...authHandlers, ...handlers };
}

export function getAuthHandlers() {
  return authHandlers;
}

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use(
  (config) => {
    const token = authHandlers.getToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const user = authHandlers.getSessionUser();
    if (user?.municipalCode && !config.headers['X-Municipal-Code'] && !config.headers['X-Municipality-Id']) {
      config.headers['X-Municipal-Code'] = user.municipalCode;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._noAuth) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (!authHandlers.refreshToken) {
        return formatError(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return httpClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const result = await authHandlers.refreshToken();
        const newToken = result?.token || authHandlers.getToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        try {
          if (authHandlers.logout) {
            await authHandlers.logout();
          }
        } catch {
        }
        const basePath = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/';
        const loginUrl = `${basePath}login`;
        if (window.location.pathname !== loginUrl && !window.location.pathname.endsWith('/login')) {
          window.location.href = loginUrl;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return formatError(error);
  }
);

function formatError(error) {
  if (error.response) {
    const { status, data } = error.response;
    let message =
      data?.message ||
      data?.error ||
      data?.detail ||
      data?.errorMessage ||
      (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
      `Error ${status}: ${error.response.statusText}`;

    if (status === 403) {
      message = data?.message || 'No tienes permisos para realizar esta acción';
    }

    const formatted = new Error(message);
    formatted.status = status;
    formatted.data = data;
    formatted.errorData = data;
    formatted.isForbidden = status === 403;
    formatted.originalError = error;
    return Promise.reject(formatted);
  }

  if (error.request) {
    const networkError = new Error('No pudimos conectar con el servidor. Revisa tu conexión a internet.');
    networkError.isNetworkError = true;
    networkError.originalError = error;
    return Promise.reject(networkError);
  }

  return Promise.reject(error);
}

export function createHttp(baseURL, options = {}) {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}${baseURL}`,
    timeout: options.timeout || 30000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = authHandlers.getToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const user = authHandlers.getSessionUser();
      if (user?.municipalCode && !config.headers['X-Municipal-Code'] && !config.headers['X-Municipality-Id']) {
        config.headers['X-Municipal-Code'] = user.municipalCode;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => {
      const contentType = response.headers['content-type'];
      if (response.status === 204) return { success: true };
      if (contentType && contentType.includes('application/json')) return response.data;
      return response.data || { success: true };
    },
    async (error) => {
      const originalRequest = error.config;
      if (!originalRequest || originalRequest._noAuth) {
        return Promise.reject(error);
      }

      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh');

      if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
        if (!authHandlers.refreshToken) {
          return formatError(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const result = await authHandlers.refreshToken();
          const newToken = result?.token || authHandlers.getToken();
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          try {
            if (authHandlers.logout) {
              await authHandlers.logout();
            }
          } catch {
          }
          const basePath = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/';
          window.location.href = `${basePath}login`;
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (options.handleValidation && error.response?.status === 400 && error.response?.data) {
        const rawErrors = error.response.data?.validationErrors ||
          error.response.data?.errors ||
          error.response.data?.fieldErrors;
        if (rawErrors && options.formatValidationErrors) {
          const detail = options.formatValidationErrors(rawErrors);
          const validationError = new Error(detail || 'Error de validación');
          validationError.validationErrors = rawErrors;
          return Promise.reject(validationError);
        }
      }

      return formatError(error);
    }
  );

  return instance;
}

export default httpClient;
