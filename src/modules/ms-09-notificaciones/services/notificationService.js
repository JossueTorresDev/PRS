import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env';

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL')}/notifications`;

export async function getNotifications() {
  const { data } = await httpClient.get(`${API_BASE_URL}/me`);
  return Array.isArray(data) ? data : [];
}

export async function getUnreadCount() {
  const { data } = await httpClient.get(`${API_BASE_URL}/unread-count`);
  return typeof data === 'number' ? data : 0;
}

export async function markAsRead(id) {
  await httpClient.put(`${API_BASE_URL}/${id}/read`);
}

export async function markAllAsRead(ids) {
  if (!ids || ids.length === 0) return;
  await Promise.allSettled(ids.map((id) => markAsRead(id)));
}
