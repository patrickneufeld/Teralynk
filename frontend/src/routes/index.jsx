// File: /frontend/src/routes/index.jsx

import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { routeConfig } from './config';
import AppLayout from '../layouts/AppLayout';
import RequireAuth from '../components/RequireAuth';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import LoadingSpinner from '../components/LoadingSpinner';

// Root layout component that uses AppLayout
const RootLayout = () => {
  return (
    <AppLayout
      header={<Header />}
      sidebar={<Sidebar />} 
      footer={<Footer />}
    >
      <React.Suspense fallback={<LoadingSpinner />}>
        <Outlet />
      </React.Suspense>
    </AppLayout>
  );
};

// Flatten protected routes with authentication wrapper
const protectedRoutes = Object.values(routeConfig.protected)
  .flat()
  .map(route => ({
    ...route,
    element: (
      <RequireAuth permissions={route.permissions}>
        {route.element}
      </RequireAuth>
    )
  }));

// Create router configuration  
const routes = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      // Public routes
      ...routeConfig.public,
      // Protected routes
      ...protectedRoutes,
      // Catch-all route
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
];

// Create router with future flags
export const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

// Add error handling
router.subscribe(state => {
  if (state.error) {
    console.error('Router error:', state.error);
  }
});

export default router;
