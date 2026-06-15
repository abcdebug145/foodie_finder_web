import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useEffect, useRef } from 'react';
import UserAvatar from './UserAvatar.jsx';

export default function NotificationDropdown({ onClose }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    onClose();
    if (notif.restaurant_id) {
      navigate(`/restaurants/${notif.restaurant_id}`);
    }
  };

  const getRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'comment_reply':
        return '🔁';
      default:
        return '🔔';
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '12px',
        width: '360px',
        maxHeight: '480px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(42, 29, 25, 0.08)',
        background: 'rgba(253, 251, 247, 0.96)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 30px -10px rgba(42, 29, 25, 0.15), 0 1px 3px rgba(42, 29, 25, 0.05)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'inherit',
      }}
    >
      {/* CSS Keyframes injected locally */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(42, 29, 25, 0.08)',
          background: 'rgba(250, 246, 238, 0.5)',
        }}
      >
        <span style={{ fontSize: '13.5px', fontWeight: '800', color: 'var(--text-dark)' }}>
          Thông báo ({notifications.filter(n => !n.is_read).length} chưa đọc)
        </span>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={markAllAsRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '2px 4px',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Đọc tất cả
          </button>
        )}
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--primary) transparent',
        }}
      >
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '32px' }}>🔔</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Chưa có thông báo nào gửi đến bạn.
            </span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(42, 29, 25, 0.04)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: notif.is_read ? 'transparent' : 'rgba(232, 153, 81, 0.05)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = notif.is_read 
                  ? 'rgba(42, 29, 25, 0.02)' 
                  : 'rgba(232, 153, 81, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = notif.is_read 
                  ? 'transparent' 
                  : 'rgba(232, 153, 81, 0.05)';
              }}
            >
              {/* Unread glow dot */}
              {!notif.is_read && (
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    boxShadow: '0 0 8px var(--primary)',
                  }}
                />
              )}

              {/* Sender Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <UserAvatar
                  src={notif.sender?.avatar}
                  name={notif.sender?.full_name || notif.sender?.email || 'Người dùng'}
                  size={38}
                  style={{
                    border: '1px solid rgba(42, 29, 25, 0.08)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    fontSize: '11px',
                    background: '#fff',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {getNotificationIcon(notif.type)}
                </span>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-dark)',
                    lineHeight: '1.45',
                    fontWeight: notif.is_read ? '500' : '700',
                    wordBreak: 'break-word',
                  }}
                >
                  {notif.content}
                </div>
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                    fontWeight: '600',
                  }}
                >
                  {getRelativeTime(notif.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
