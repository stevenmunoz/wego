/**
 * NotificationDropdown component
 * Displays a list of notifications in a dropdown panel
 */

import { type FC } from 'react';
import { useNotificationStore } from '@/core/store/notification-store';
import { NotificationItem } from '../NotificationItem';
import './NotificationDropdown.css';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: FC<NotificationDropdownProps> = ({ onClose }) => {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAllRead = useNotificationStore((state) => state.clearAllRead);
  const currentUserId = useNotificationStore((state) => state.currentUserId);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const error = useNotificationStore((state) => state.error);

  // Count read notifications
  const readCount = notifications.filter((n) =>
    n.read_by.includes(currentUserId || '')
  ).length;

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearRead = () => {
    clearAllRead();
  };

  return (
    <div className="notification-dropdown" role="menu" aria-label="Notificaciones">
      <div className="notification-dropdown-header">
        <h3 className="notification-dropdown-title">Notificaciones</h3>
        {unreadCount > 0 && (
          <button
            className="mark-all-read-button"
            onClick={handleMarkAllRead}
            type="button"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="notification-dropdown-body">
        {isLoading ? (
          <div className="notification-state notification-loading">
            <span className="loading-spinner" />
            <p>Cargando...</p>
          </div>
        ) : error ? (
          <div className="notification-state notification-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-state notification-empty">
            <span className="empty-icon">🔔</span>
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <ul className="notification-list" role="list">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer with clear button */}
      {readCount > 0 && !isLoading && !error && (
        <div className="notification-dropdown-footer">
          <button
            className="clear-read-button"
            onClick={handleClearRead}
            type="button"
          >
            Limpiar leídas ({readCount})
          </button>
        </div>
      )}
    </div>
  );
};
