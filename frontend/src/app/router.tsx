import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { AssistantPage } from '../pages/AssistantPage';
import { ConversationsPage } from '../pages/ConversationsPage';
import { TasksPage } from '../pages/TasksPage';
import { MemoryPage } from '../pages/MemoryPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { AppErrorBoundary } from './error-boundary';

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: '/login',
    element: (
      <AppErrorBoundary>
        <LoginPage />
      </AppErrorBoundary>
    ),
  },
  {
    path: '/register',
    element: (
      <AppErrorBoundary>
        <RegisterPage />
      </AppErrorBoundary>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <AppErrorBoundary>
        <ForgotPasswordPage />
      </AppErrorBoundary>
    ),
  },

  // Main Application Protected Shell (Data Mode)
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: (
      <AppErrorBoundary>
        <div className="min-h-screen flex items-center justify-center text-white">
          Failed to load page.
        </div>
      </AppErrorBoundary>
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <AssistantPage />,
          },
          {
            path: 'assistant',
            element: <AssistantPage />,
          },
          {
            path: 'conversations',
            element: <ConversationsPage />,
          },
          {
            path: 'tasks',
            element: <TasksPage />,
          },
          {
            path: 'memory',
            element: <MemoryPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },

  // Fallback Wildcard Route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
