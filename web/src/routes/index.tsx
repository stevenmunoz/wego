/**
 * Application routing configuration
 * Uses React.lazy() for code splitting - pages are loaded on demand
 */

/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Cargando...</div>
  </div>
);

// Wrapper for lazy-loaded components with Suspense
const withSuspense = <P extends object>(Component: ComponentType<P>) => {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

// Lazy-loaded pages for code splitting
const HomePage = withSuspense(
  lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })))
);
const LoginPage = withSuspense(
  lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
);
const RegisterPage = withSuspense(
  lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
);
const DashboardPage = withSuspense(
  lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
);
const VehiclesPage = withSuspense(
  lazy(() => import('../pages/VehiclesPage').then((m) => ({ default: m.VehiclesPage })))
);
const ChatPage = withSuspense(
  lazy(() => import('../pages/ChatPage').then((m) => ({ default: m.ChatPage })))
);
const ConversationsPage = withSuspense(
  lazy(() => import('../pages/ConversationsPage').then((m) => ({ default: m.ConversationsPage })))
);
const InDriverImportPage = withSuspense(
  lazy(() => import('../pages/InDriverImportPage').then((m) => ({ default: m.InDriverImportPage })))
);
const ExternalRideFormPage = withSuspense(
  lazy(() =>
    import('../pages/ExternalRideFormPage').then((m) => ({ default: m.ExternalRideFormPage }))
  )
);
const UserManagementPage = withSuspense(
  lazy(() => import('../pages/UserManagementPage').then((m) => ({ default: m.UserManagementPage })))
);
const VehicleFinancesPage = withSuspense(
  lazy(() =>
    import('../pages/VehicleFinancesPage').then((m) => ({ default: m.VehicleFinancesPage }))
  )
);
const ReportingPage = withSuspense(
  lazy(() => import('../pages/ReportingPage').then((m) => ({ default: m.ReportingPage })))
);
const FinanceCategoriesPage = withSuspense(
  lazy(() =>
    import('../pages/FinanceCategoriesPage').then((m) => ({ default: m.FinanceCategoriesPage }))
  )
);

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
