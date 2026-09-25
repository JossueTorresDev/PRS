import { getEnv } from '../../../shared/utils/env.js';
import { normalizeRoles } from '../../../shared/utils/roleUtils.js';
import { setAuthHandlers } from '../../../shared/services/httpClient.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

// Importar municipalityHelper para gestión de IDs de municipalidad
import { getMunicipalityId } from '../../../shared/utils/municipalityHelper.js';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  VALIDATE: '/auth/validate',
};

class AuthService {
  constructor() {
    this._refreshTimer = null;
    this._isRefreshing = false;
    this._refreshPromise = null;
    this.syncFromStorage();
    const expiresIn = parseInt(sessionStorage.getItem('expiresIn') || '0');
    if (this.token && expiresIn > 0) {
      this._scheduleTokenRefresh(expiresIn);
    }
    setAuthHandlers({
      refreshToken: () => this.refreshToken(),
      logout: () => this.logout(),
    });
  }

  syncFromStorage() {
    this.token = sessionStorage.getItem('accessToken');
    try {
      this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
    } catch {
      this.user = null;
    }
    return this;
  }

  _scheduleTokenRefresh(expiresInSeconds) {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
    const refreshInMs = Math.max((expiresInSeconds - 120) * 1000, 30000);
    this._refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (err) {
      }
    }, refreshInMs);
  }

  async request(endpoint, options = {}) {
    this.syncFromStorage();
    const url = `${API_BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    };
    if (this.token && !endpoint.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }
    try {
      const response = await fetch(url, config);
      clearTimeout(timeout);
      if (!response.ok) {
        if (response.status === 401 && !options._retry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/logout')) {
          try {
            await this.refreshToken();
            return this.request(endpoint, { ...options, _retry: true });
          } catch (refreshErr) {
            this.logout();
            const error = new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            error.status = 401;
            throw error;
          }
        }
        let errorData = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          }
        } catch (e) {
        }
        const errorMessage = errorData.message || errorData.error || errorData.errorMessage || `Error ${response.status}: ${response.statusText}`;
        const error = new Error(
          response.status === 403
            ? 'No tienes permisos para realizar esta acción'
            : errorMessage
        );
        error.status = response.status;
        error.data = errorData;
        error.errorData = errorData;
        error.isForbidden = response.status === 403;
        throw error;
      }
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {};
      }
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      const text = await response.text();
      return text ? { message: text } : {};
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        const timeoutError = new Error('No pudimos conectar con el servidor. Revisa tu conexión a internet.');
        timeoutError.isNetworkError = true;
        throw timeoutError;
      }
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const networkError = new Error('No pudimos conectar con el servidor. Revisa tu conexión a internet.');
        networkError.isNetworkError = true;
        throw networkError;
      }
      throw error;
    }
  }

  async login(credentials) {
    try {
      try {
        const response = await this.request(AUTH_ENDPOINTS.LOGIN, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        if (response.accessToken) {
          const token = response.accessToken;
          const roles = normalizeRoles(response.roles || []);
          if (roles.length === 0) {
            throw new Error('Su cuenta no tiene roles asignados. Por favor, contacte al administrador.');
          }
          let permissions = response.permissions || [];
          // No obtener permisos adicionales aquí - se cargarán bajo demanda para acelerar login
          const user = {
            userId: response.userId,
            username: response.username,
            nombre: response.nombre || response.username,
            status: response.status,
            roles: roles,
            permissions: Array.isArray(permissions) ? permissions : [],
            municipalCode: response.municipalCode || sessionStorage.getItem('municipalCode'),
            requiresPasswordReset: response.requiresPasswordReset || false,
          };
          const expiresIn = response.expiresIn || 3600;
          sessionStorage.setItem('accessToken', token);
          sessionStorage.setItem('refreshToken', response.refreshToken);
          sessionStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('municipalCode', response.municipalCode || '');
          sessionStorage.setItem('tokenType', response.tokenType || 'Bearer');
          sessionStorage.setItem('expiresIn', expiresIn);
          sessionStorage.setItem('authMode', 'production');
          this._scheduleTokenRefresh(expiresIn);
          sessionStorage.removeItem('manualLogout');
          this.token = token;
          this.user = user;

          // 🔍 Integración con municipalityHelper - Detectar y loguear el ID de municipalidad
          console.log('🔐 Login exitoso. Detectando municipalityId desde el JWT...');
          const detectedMunicipalityId = getMunicipalityId();
          
          if (detectedMunicipalityId) {
            console.log('✅ MunicipalityId integrado exitosamente en el login');
          } else {
            console.warn('⚠️ No se pudo detectar municipalityId en el login');
          }

          return { success: true, user, token };
        } else {
          throw new Error('Respuesta inválida del servidor: Token faltante');
        }
      } catch (backendError) {
        const errorData = backendError.errorData || {};
        const backendMsg = (backendError.message || "").toLowerCase();
        if (
          backendMsg.includes("role") ||
          backendMsg.includes("rol") ||
          backendMsg.includes("permis") ||
          backendMsg.includes("acceso") ||
          errorData.remainingAttempts !== undefined
        ) {
          throw backendError;
        }
        if (backendError.status === 401) {
          const errorMsg = errorData.message || errorData.error || 'El usuario o la contraseña ingresados no son correctos.';
          const error = new Error(errorMsg);
          error.status = 401;
          error.errorData = errorData;
          throw error;
        }
        if (backendError.status === 403) {
          const error = new Error('Acceso Restringido: No cuenta con privilegios suficientes para acceder a este módulo.');
          error.status = 403;
          error.errorData = errorData;
          throw error;
        }
        throw backendError;
      }
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      this.syncFromStorage();
      if (this.token) {
        await this.request(AUTH_ENDPOINTS.LOGOUT, {
          method: 'POST',
        }).catch(() => {});
      }
      this._clearSessionStorage();
      sessionStorage.setItem('manualLogout', 'true');
      this.token = null;
      this.user = null;
      return { success: true };
    } catch (error) {
      this._clearSessionStorage();
      this.token = null;
      this.user = null;
      throw error;
    }
  }

  _clearSessionStorage() {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tokenType');
    sessionStorage.removeItem('expiresIn');
    sessionStorage.removeItem('authMode');
    sessionStorage.removeItem('municipalCode');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('muniName');
    sessionStorage.removeItem('muniRuc');
    sessionStorage.removeItem('muniDireccion');
    sessionStorage.removeItem('muniEmail');
    sessionStorage.removeItem('muniLogo');
    sessionStorage.removeItem('areas_cache');
    sessionStorage.removeItem('positions_cache');
    sessionStorage.removeItem('document_types_cache');
    sessionStorage.removeItem('legacy_cleaned_v7');
    localStorage.removeItem('sidebarExpanded');
  }

  isAuthenticated() {
    this.syncFromStorage();
    return !!(this.token && this.user);
  }

  getCurrentUser() {
    this.syncFromStorage();
    return this.user;
  }

  getToken() {
    this.syncFromStorage();
    return this.token;
  }

  async verifyToken() {
    if (!this.token) {
      return false;
    }
    const mode = sessionStorage.getItem('authMode');
    if (mode === 'demo') {
      return true;
    }
    try {
      const response = await this.request(AUTH_ENDPOINTS.VALIDATE, {
        method: 'POST',
      });
      return true;
    } catch (error) {
      if (error.status === 401) {
        return false;
      }
      return true;
    }
  }

  async refreshToken() {
    if (this._isRefreshing) {
      return this._refreshPromise;
    }
    this._isRefreshing = true;
    this._refreshPromise = this._doRefresh().finally(() => {
      this._isRefreshing = false;
      this._refreshPromise = null;
    });
    return this._refreshPromise;
  }

  async _doRefresh() {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No hay refresh token');
      }
      const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        const refreshError = new Error('Error al refrescar token');
        refreshError.status = response.status;
        throw refreshError;
      }
      const data = await response.json();
      if (data.accessToken) {
        const expiresIn = data.expiresIn || 3600;
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('expiresIn', expiresIn);
        if (data.refreshToken) {
          sessionStorage.setItem('refreshToken', data.refreshToken);
        }
        this.token = data.accessToken;
        this._scheduleTokenRefresh(expiresIn);

        if (data.roles || data.permissions) {
          const currentUser = this.getCurrentUser() || {};
          const updatedUser = {
            ...currentUser,
            ...(data.roles ? { roles: normalizeRoles(data.roles) } : {}),
            ...(data.permissions ? { permissions: data.permissions } : {}),
          };
          this.user = updatedUser;
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          this.syncFromStorage();
        }

        return { success: true, token: data.accessToken };
      }
      throw new Error('Respuesta invalida del servidor');
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        this.logout();
      }
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (response.success) {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Error al cambiar contrasena');
    } catch (error) {
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (response.success) {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Error al solicitar restablecimiento');
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });
      if (response.success) {
        return { success: true, message: response.message };
      }
      throw new Error(response.message || 'Error al restablecer contrasena');
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await this.request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      if (response.success && response.data) {
        this.user = response.data.user;
        sessionStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, user: this.user };
      }
      throw new Error(response.message || 'Error al actualizar perfil');
    } catch (error) {
      throw error;
    }
  }
}

const authService = new AuthService();

export default authService;
