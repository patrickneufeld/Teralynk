// ================================================
// ✅ FILE: /frontend/src/routes/index.jsx
// Complete React Router Setup with Auth and Public Routes
// ================================================

import React from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import RequireAuth from '../components/RequireAuth';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

import Dashboard from '../pages/Dashboard';
import Home from '../pages/Home';
import Login from '../components/Login';
import Signup from '../pages/Signup';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';

// ✅ Layout with full UI (Header, Sidebar, Footer)
const RootLayout = () => (
  <AppLayout
    header={<Header />}
    sidebar={<Sidebar />}
    footer={<Footer />}
  >
    <React.Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </React.Suspense>
  </AppLayout>
);

// ✅ Layout without full UI (used for public pages)
const PublicLayout = () => (
  <React.Suspense fallback={<LoadingSpinner />}>
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  </React.Suspense>
);

// ✅ Protected application routes (requires auth)
const protectedRoutes = [
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
];

// ✅ Public routes that don't require login
const publicRoutes = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/reset',
    element: <ResetPassword />,
  },
];

// ✅ Combine full router structure
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: protectedRoutes,
  },
  {
    element: <PublicLayout />,
    children: publicRoutes,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
