import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5000/api/v1');

class DashboardService {
    async getSummary() {
      const { data } = await httpClient.get(`${API_BASE_URL}/dashboard/summary`);
      return data;
    }
}

const dashboardService = new DashboardService();
export default dashboardService;
