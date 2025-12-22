/**
 * Application routing configuration
 */

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { HomePage } from '../pages/HomePage';
import { ChatPage } from '../pages/ChatPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { InDriverImportPage } from '../pages/InDriverImportPage';
import { ExternalRideFormPage } from '../pages/ExternalRideFormPage';
import { UserManagementPage } from '../pages/UserManagementPage';
import { VehicleFinancesPage } from '../pages/VehicleFinancesPage';
import { ReportingPage } from '../pages/ReportingPage';
import { FinanceCategoriesPage } from '../pages/FinanceCategoriesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // Public form for external ride registration (no auth required)
  {
    path: '/registrar-viaje/:driverSlug',
    element: <ExternalRideFormPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/vehicles',
        element: <VehiclesPage />,
      },
      {
        path: '/chat',
        element: <ChatPage />,
      },
      {
        path: '/chat/:conversationId',
        element: <ChatPage />,
      },
      {
        path: '/conversations',
        element: <ConversationsPage />,
      },
      {
        path: '/indriver-import',
        element: <InDriverImportPage />,
      },
      {
        path: '/users',
        element: <UserManagementPage />,
      },
      {
        path: '/finances',
        element: <VehicleFinancesPage />,
      },
      {
        path: '/reporting',
        element: <ReportingPage />,
      },
      {
        path: '/admin/categories',
        element: <FinanceCategoriesPage />,
      },
    ],
  },
]);
