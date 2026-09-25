import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5002');
const USERS_ENDPOINT = '/users';

class HandoverUserService {
  async getAllUsers() {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${USERS_ENDPOINT}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error.status === 404) return [];
      throw error;
    }
  }

  async getUserById(id) {
    const { data } = await httpClient.get(`${API_BASE_URL}${USERS_ENDPOINT}/${id}`);
    return data;
  }

  async getActiveUsers() {
    const allUsers = await this.getAllUsers();
    return allUsers.filter(user => user.status === 'ACTIVE');
  }

  async getUsersByMunicipality(municipalityId) {
    try {
      const allUsers = await this.getAllUsers();
      const filteredUsers = allUsers.filter(user => {
        const isActive = user.status === 'ACTIVE';
        if (!municipalityId) return isActive;
        return isActive && user.municipalCode === municipalityId;
      });
      return filteredUsers.map(user => ({
        id: user.personId,
        userId: user.id,
        username: user.username,
        personId: user.personId,
        status: user.status,
        municipalCode: user.municipalCode
      }));
    } catch {
      return [];
    }
  }
}

export default new HandoverUserService();
