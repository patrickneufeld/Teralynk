// ================================================
// ✅ FILE: /frontend/src/routes/index.jsx
// Centralized Route Loader for Teralynk (React Router v6+)
// ================================================

import React from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTE_COMPONENTS, PERMISSIONS } from "./config";
import RootLayout from "../layouts/RootLayout";
import RequireAuth from "./guards/RequireAuth";
import LoadingSpinner from "../components/LoadingSpinner";

// -----------------------------------
// Utility for protected route mapping
// -----------------------------------
const makeProtectedRoutes = (routes, permissions) =>
  routes.map(({ path, name, component, permissions: perms }) => (
    <Route
      key={path}
      path={path.replace(/^\//, "")}
      element={
        <RequireAuth permissions={perms || permissions}>
          {React.createElement(component)}
        </RequireAuth>
      }
    />
  ));

// -----------------------------------
// ROUTE DEFINITION
// -----------------------------------
export default function AppRoutes() {
  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* All routes wrapped in RootLayout */}
        <Route element={<RootLayout />}>
          {/* --- Public Routes --- */}
          <Route index element={<ROUTE_COMPONENTS.Home />} />
          <Route path="about" element={<ROUTE_COMPONENTS.About />} />
          <Route path="login" element={<ROUTE_COMPONENTS.Login />} />
          <Route path="signup" element={<ROUTE_COMPONENTS.Signup />} />
          <Route path="reset" element={<ROUTE_COMPONENTS.ResetPassword />} />
          <Route path="confirm-reset" element={<ROUTE_COMPONENTS.ConfirmResetPassword />} />
          <Route path="john316" element={<ROUTE_COMPONENTS.John316 />} />

          {/* --- Dashboard / Protected Routes --- */}
          <Route
            path="dashboard"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="admin-dashboard"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="insights"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Insights />
              </RequireAuth>
            }
          />
          <Route
            path="performance"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.PerformanceDashboard />
              </RequireAuth>
            }
          />

          {/* --- AI Routes --- */}
          <Route
            path="ai"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.AIWorkbench />
              </RequireAuth>
            }
          />
          <Route
            path="ai-analytics"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_READ]}>
                <ROUTE_COMPONENTS.AIAnalytics />
              </RequireAuth>
            }
          />
          <Route
            path="ai-assistant"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_USE]}>
                <ROUTE_COMPONENTS.AIAssistant />
              </RequireAuth>
            }
          />
          <Route
            path="ai-benchmark"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_READ]}>
                <ROUTE_COMPONENTS.AIBenchmark />
              </RequireAuth>
            }
          />
          <Route
            path="ai-performance"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_READ]}>
                <ROUTE_COMPONENTS.AiPerformanceLogs />
              </RequireAuth>
            }
          />
          <Route
            path="ai-recommendations"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_USE]}>
                <ROUTE_COMPONENTS.AIRecommendations />
              </RequireAuth>
            }
          />
          <Route
            path="ai-training"
            element={
              <RequireAuth permissions={[PERMISSIONS.AI_TRAIN]}>
                <ROUTE_COMPONENTS.AITrainingPanel />
              </RequireAuth>
            }
          />

          {/* --- Storage Routes --- */}
          <Route
            path="files"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.FileManager />
              </RequireAuth>
            }
          />
          <Route
            path="storage"
            element={
              <RequireAuth permissions={[PERMISSIONS.STORAGE_READ]}>
                <ROUTE_COMPONENTS.S3FileExplorer />
              </RequireAuth>
            }
          />
          <Route
            path="upload"
            element={
              <RequireAuth permissions={[PERMISSIONS.STORAGE_WRITE]}>
                <ROUTE_COMPONENTS.FileUpload />
              </RequireAuth>
            }
          />
          <Route
            path="add-storage"
            element={
              <RequireAuth permissions={[PERMISSIONS.STORAGE_WRITE]}>
                <ROUTE_COMPONENTS.AddStorage />
              </RequireAuth>
            }
          />
          <Route
            path="storage-manager"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.StorageManager />
              </RequireAuth>
            }
          />

          {/* --- Account Routes --- */}
          <Route
            path="profile"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Profile />
              </RequireAuth>
            }
          />
          <Route
            path="settings"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Settings />
              </RequireAuth>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Notifications />
              </RequireAuth>
            }
          />

          {/* --- System Routes --- */}
          <Route
            path="audit-log"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.AuditLog />
              </RequireAuth>
            }
          />
          <Route
            path="team"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.TeamManagement />
              </RequireAuth>
            }
          />
          <Route
            path="marketplace"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Marketplace />
              </RequireAuth>
            }
          />
          <Route
            path="help"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Help />
              </RequireAuth>
            }
          />
          <Route
            path="contact"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Contact />
              </RequireAuth>
            }
          />
          <Route
            path="onboarding"
            element={
              <RequireAuth permissions={[PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Onboarding />
              </RequireAuth>
            }
          />
          <Route
            path="collaboration"
            element={
              <RequireAuth permissions={[PERMISSIONS.USER, PERMISSIONS.ADMIN]}>
                <ROUTE_COMPONENTS.Collaboration />
              </RequireAuth>
            }
          />

          {/* --- 404 fallback --- */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </React.Suspense>
  );
}
