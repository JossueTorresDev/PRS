import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

class RoleService {

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
      throw error;
    }
  }

  async createRole(roleData) {
    return await this.request("/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  async getAllRoles() { return await this.request("/roles"); }
  async getActiveRoles() { return await this.request("/roles/active"); }
  async getRoleById(id) { return await this.request(`/roles/${id}`); }
  async getRoleByName(name) { return await this.request(`/roles/name/${name}`); }

  async updateRole(id, roleData) {
    return await this.request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    });
  }

  async deleteRole(id) {
    return await this.request(`/roles/${id}`, {
      method: "DELETE",
    });
  }

  async restoreRole(id) {
    return await this.request(`/roles/${id}/restore`, {
      method: "PATCH",
    });
  }

  getCurrentUser() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  }

  isSuperAdmin(userPayload = null) {
    if (!userPayload) {
      const token = sessionStorage.getItem('accessToken');
      if (!token) return false;
      try {
        userPayload = JSON.parse(atob(token.split(".")[1]));
      } catch {
        return false;
      }
    }
    const roles = userPayload.roles || userPayload.authorities || [];
    return roles.some(
      (role) =>
        role === "SUPER_ADMIN" ||
        role === "ROLE_SUPER_ADMIN" ||
        (typeof role === "object" &&
          (role.authority === "SUPER_ADMIN" || role.authority === "ROLE_SUPER_ADMIN"))
    );
  }
}

const roleService = new RoleService();
export default roleService;
