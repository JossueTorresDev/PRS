import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', 'http://localhost:5005');
const HANDOVER_RECEIPTS_ENDPOINT = '/handover-receipts';

class HandoverReceiptService {
  async createHandoverReceipt(receiptData) {
    const response = await httpClient.post(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}`, receiptData);
    return response.data;
  }

  async getHandoverReceiptById(id) {
    const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}`);
    return data;
  }

  async getAllHandoverReceipts() {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error.status === 404 || error.status === 500) return [];
      throw error;
    }
  }

  async getHandoverReceiptByMovement(movementId) {
    const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/movement/${movementId}`);
    return data;
  }

  async getHandoverReceiptsByStatus(status) {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/status/${status}`);
      return data;
    } catch {
      return [];
    }
  }

  async getHandoverReceiptsByResponsible(responsibleId) {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/responsible/${responsibleId}`);
      return data;
    } catch {
      return [];
    }
  }

  async signHandoverReceipt(id, signatureData) {
    const response = await httpClient.post(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}/sign`, signatureData);
    return response.data;
  }

  async countHandoverReceipts() {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/count`);
      return data;
    } catch {
      return 0;
    }
  }

  async countHandoverReceiptsByStatus(status) {
    try {
      const { data } = await httpClient.get(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/count/status/${status}`);
      return data;
    } catch {
      return 0;
    }
  }

  async updateHandoverReceipt(id, receiptData) {
    const response = await httpClient.put(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}`, receiptData);
    return response.data;
  }

  async voidHandoverReceipt(id) {
    const response = await httpClient.patch(`${API_BASE_URL}${HANDOVER_RECEIPTS_ENDPOINT}/${id}/void`);
    return response.data;
  }
}

export default new HandoverReceiptService();
