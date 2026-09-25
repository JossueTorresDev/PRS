import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getEnv } from '../../../shared/utils/env';

class NotificationWsService {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  connect(token, municipalCode, onNotification) {
    if (this.connected) return;

    const gatewayUrl = getEnv('VITE_GATEWAY_API_URL');
    const wsUrl = getEnv(
      'VITE_NOTIFICATIONS_WS_URL',
      `${gatewayUrl.replace('/api/v1', '')}/ws/notifications`
    );

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        municipalCode: municipalCode,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true;
        this.client.subscribe('/user/queue/notifications', (message) => {
          try {
            const notification = JSON.parse(message.body);
            if (onNotification) onNotification(notification);
          } catch {
            // Ignore malformed messages
          }
        });
        this.client.publish({ destination: '/app/notifications.getPending' });
      },
      onDisconnect: () => {
        this.connected = false;
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.client = null;
    }
  }

  markAsRead(id) {
    if (this.client && this.connected) {
      this.client.publish({
        destination: '/app/notifications.markRead',
        body: JSON.stringify({ id }),
      });
    }
  }

  isConnected() {
    return this.connected;
  }
}

const notificationWsService = new NotificationWsService();
export default notificationWsService;
