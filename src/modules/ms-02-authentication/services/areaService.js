import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');
const CACHE_KEY = 'areas_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

class AreaService {
    async request(endpoint) {
      const { data } = await httpClient.get(`${API_BASE_URL}${endpoint}`);
      return data;
    }

    getFromCache(ignoreExpiration = false) {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > CACHE_DURATION && !ignoreExpiration) return null;
            return data;
        } catch {
            return null;
        }
    }

    saveToCache(data) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {}
    }

    async getAllAreas() {
        try {
            const cached = this.getFromCache();
            if (cached) return cached;
            const data = await this.request('/areas');
            if (!Array.isArray(data)) throw new Error('Invalid API response format');
            this.saveToCache(data);
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getActiveAreas() {
        const areas = await this.getAllAreas();
        return areas.filter(a => a.active);
    }

    async getAreaById(id) {
        const areas = await this.getAllAreas();
        return areas.find(a => a.id === id);
    }

    clearCache() {
        try { sessionStorage.removeItem(CACHE_KEY); } catch {}
    }
}

const areaService = new AreaService();
export default areaService;
