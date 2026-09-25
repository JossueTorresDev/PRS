import { useState, useEffect, useCallback, useRef } from 'react';
import notificationWs from '../services/websocketService';
import {
  getNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../services/notificationService.js';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  const getAuth = useCallback(() => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const raw = sessionStorage.getItem('user');
      const user = raw ? JSON.parse(raw) : {};
      let municipalCode = user?.municipalCode || '';
      if (!municipalCode) {
        const payload = token
          ? JSON.parse(atob(token.split('.')[1]))
          : {};
        municipalCode = payload.municipal_code || payload.municipalCode || '';
      }
      return { token, municipalCode };
    } catch {
      return { token: null, municipalCode: '' };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getNotifications();
        if (cancelled) return;
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      } catch {
        // Silent fail on initial load
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const { token, municipalCode } = getAuth();
    if (!token) return;

    notificationWs.connect(token, municipalCode, (newNotification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    });

    setConnected(true);
    wsRef.current = true;

    return () => {
      notificationWs.disconnect();
      setConnected(false);
      wsRef.current = false;
    };
  }, [getAuth]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await apiMarkAsRead(id);
    } catch {
      notificationWs.markAsRead(id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;
    await apiMarkAllAsRead(unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    connected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}
