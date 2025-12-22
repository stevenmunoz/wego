/**
 * NotificationBell component
 * Bell icon with unread count badge that toggles the notification dropdown
 */

import { type FC, useState, useRef, useEffect } from 'react';
import { useNotificationStore } from '@/core/store/notification-store';
import { NotificationDropdown } from '../NotificationDropdown';
import './NotificationBell.css';

export const NotificationBell: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Format badge text
  const badgeText = unreadCount > 99 ? '99+' : unreadCount.toString();

  return (
    <div className="notification-bell-container" ref={containerRef}>
      <button
        className={`notification-bell-button ${isOpen ? 'notification-bell-button-active' : ''}`}
        onClick={handleToggle}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span className="bell-icon" aria-hidden="true">
          🔔
        </span>
        {!isLoading && unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown onClose={handleClose} />}
    </div>
  );
};
