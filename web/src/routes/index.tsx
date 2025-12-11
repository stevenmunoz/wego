/**
 * Application routing configuration
 */

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { ChatPage } from '../pages/ChatPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { InDriverImportPage } from '../pages/InDriverImportPage';

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
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
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
    ],
  },
]);
