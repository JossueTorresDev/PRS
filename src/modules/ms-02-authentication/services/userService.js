import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

class UserService {

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await httpClient({
        method: options.method || 'GET',
        url,
        data: options.body ? JSON.parse(options.body) : undefined,
        headers: options.headers || {},
      });
      return response.data;
    } catch (error) {
      if (error.data && (error.data.trace || error.data.timestamp || error.data.path || error.data.errors || error.data.detail)) {
        let errorMessage = error.message;
        const errorData = error.data;

        if (errorData.trace && String(errorData.trace).includes('NullPointerException')) {
          errorMessage = 'Error: Uno de los campos requeridos esta vacio o es nulo.';
        }

        const enhanced = new Error(errorMessage);
        enhanced.details = errorData;
        enhanced.status = error.status;
        throw enhanced;
      }
      throw error;
    }
  }

  async getAllUsers() { return await this.request('/users'); }
  async existsByUsername(username) { return await this.request(`/users/exists/${username}`); }

  async patchUserCredentials(userId, credentials) {
    return await this.request(`/users/${userId}/credentials`, {
      method: 'PATCH',
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async patchUserEmployment(userId, employmentData) {
    return await this.request(`/users/${userId}/employment`, {
      method: 'PATCH',
      body: JSON.stringify(employmentData),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async createUser(userData) {
    return await this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData, updatedByOverride) {
    const currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');
    const updatedBy = updatedByOverride || currentUser?.userId || null;
    const qp = updatedBy
      ? `?updatedBy=${encodeURIComponent(updatedBy)}&updatedById=${encodeURIComponent(updatedBy)}`
      : '';
    return await this.request(`/users/${userId}${qp}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async validateUpdateUser(userId, userData) {
    return await this.request(`/users/${userId}/validate-update`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/users/${userId}?updatedBy=${updatedBy}`, {
      method: 'DELETE',
    });
  }

  async restoreUser(userId) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/users/${userId}/restore?updatedBy=${updatedBy}`, {
      method: 'PATCH',
    });
  }

  async changeUserStatus(userId, status) {
    return await this.request(`/users/${userId}/status/${status}`, {
      method: 'PATCH',
    });
  }

  async suspendUser(userId, reason, suspensionEnd) {
    return await this.request(`/users/${userId}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify({
        reason,
        suspensionEnd: suspensionEnd ? new Date(suspensionEnd).toISOString() : null
      }),
    });
  }

  async unsuspendUser(userId) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/users/${userId}/restore?updatedBy=${updatedBy}`, {
      method: 'PATCH',
    });
  }

  async blockUser(userId, reason, options = {}) {
    const body = { reason };
    if (options.blockedUntil) body.blockedUntil = new Date(options.blockedUntil).toISOString();
    if (options.durationHours) body.durationHours = options.durationHours;
    return await this.request(`/users/${userId}/block`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async unblockUser(userId) {
    return await this.request(`/users/${userId}/unblock`, {
      method: 'PATCH'
    });
  }

  async getActiveUsers() { return await this.request('/users/active'); }
  async getInactiveUsers() { return await this.request('/users/inactive'); }
  async getSuspendedUsers() { return await this.request('/users/suspended'); }

  async getBlockedUsers(page = 0, size = 10) {
    return await this.request(`/users/blocked?page=${page}&size=${size}`);
  }

  async getUserByUsername(username) {
    return await this.request(`/users/username/${encodeURIComponent(username)}`);
  }

  async checkUsernameExists(username) {
    return await this.request(`/users/exists/${encodeURIComponent(username)}`);
  }

  async forceUnblockExpired() {
    return await this.request('/users/force-unblock-expired', {
      method: 'POST'
    });
  }
}

const userService = new UserService();
export default userService;
