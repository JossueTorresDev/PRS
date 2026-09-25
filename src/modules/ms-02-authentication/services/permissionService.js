import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

class PermissionService {

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
      if (error.data?.errors) {
        const validationMessages = Object.entries(error.data.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join(' | ');
        const enhanced = new Error(validationMessages || error.message);
        enhanced.details = error.data;
        enhanced.status = error.status;
        throw enhanced;
      }
      throw error;
    }
  }

  async createPermission(permissionData) {
    return await this.request("/permissions", {
      method: "POST",
      body: JSON.stringify(permissionData),
    });
  }

  async getAllPermissions() { return await this.request("/permissions"); }
  async getPermissionById(id) { return await this.request(`/permissions/${id}`); }

  async searchPermissions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.module) params.append("module", filters.module);
    if (filters.action) params.append("action", filters.action);
    if (filters.resource) params.append("resource", filters.resource);
    const queryString = params.toString();
    const endpoint = queryString ? `/permissions/search?${queryString}` : "/permissions";
    return await this.request(endpoint);
  }

  async updatePermission(id, permissionData) {
    return await this.request(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(permissionData),
    });
  }

  async deletePermission(id) {
    return await this.request(`/permissions/${id}`, {
      method: "DELETE",
    });
  }

  async restorePermission(id) {
    return await this.request(`/permissions/${id}/restore`, {
      method: "PATCH",
    });
  }
}

const permissionService = new PermissionService();
export default permissionService;
