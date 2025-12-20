/**
 * Header component
 * Top header bar with notification bell for admin users
 */

import { type FC } from 'react';
import { NotificationBell } from '../NotificationBell';
import './Header.css';

export const Header: FC = () => {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        {/* Placeholder for breadcrumb or page title if needed */}
      </div>
      <div className="header-right">
        <NotificationBell />
      </div>
    </header>
  );
};
