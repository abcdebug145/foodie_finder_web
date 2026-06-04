import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { toast } from '../components/Toast.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('ff_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  const markAsRead = async (notifId) => {
    const token = localStorage.getItem('ff_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('ff_token');
    if (!token) return;
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    fetchNotifications();

    // Setup WebSockets
    const token = localStorage.getItem('ff_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}${wsHost}/api/v1/notifications/ws?token=${token}`;

    console.log("[WS] Connecting to:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        if (event.data === 'pong') return; // ignore pong heartbeats
        const notif = JSON.parse(event.data);
        setNotifications(prev => [notif, ...prev]);
        toast(notif.content, "success");
      } catch (err) {
        console.error("Error parsing notification from ws:", err);
      }
    };

    // Heartbeat to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);

    ws.onclose = () => {
      console.log("[WS] Connection closed");
      clearInterval(pingInterval);
    };

    ws.onerror = (err) => {
      console.error("[WS] Connection error:", err);
      clearInterval(pingInterval);
    };

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      fetchNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
