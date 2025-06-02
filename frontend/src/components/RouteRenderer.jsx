// ✅ FILE: /frontend/src/components/RouteRenderer.jsx

import React, { Suspense, useRef } from "react";
import PropTypes from "prop-types";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "../routes/guards/RequireAuth";
import ErrorBoundary from "@/utils/logging/ErrorBoundary";
import Spinner from "./ui/Spinner";

// 🧠 Controlled Debug Logger (throttled)
const debugLog = (() => {
  const seen = new Set();
  const logLevel = import.meta.env.VITE_LOGGING_LEVEL || "info";
  const allowDebug = logLevel === "debug";

  return (message, data = {}, level = "info", key = "") => {
    const fullKey = key || message;
    const shouldLog =
      (level === "debug" && allowDebug && !seen.has(fullKey)) ||
      (level !== "debug" && !seen.has(fullKey));

    if (shouldLog) {
      seen.add(fullKey);
      console[level](`[DEBUG-ROUTER] ${message}`, data);
    }
  };
})();

/**
 * RouteRenderer
 * Dynamically renders route objects with optional protection and error handling.
 *
 * @param {Array} routes - Array of route objects with `path`, `component`, and optional `permissions`.
 * @param {boolean} isProtected - Indicates if the routes should be wrapped in RequireAuth.
 */
const RouteRenderer = ({ routes = [], isProtected = false }) => {
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    debugLog(
      "RouteRenderer initializing",
      { routeCount: routes.length, isProtected },
      "debug",
      `init-${isProtected}-${routes.length}`
    );
    initializedRef.current = true;
  }

  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => {
        debugLog("Error boundary triggered", { error: error?.message }, "error");
        return (
          <div className="p-6 text-center text-red-600 dark:text-red-400">
            <p>Something went wrong loading this section.</p>
            <pre className="text-xs mt-2">{error?.message}</pre>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={resetErrorBoundary}
            >
              Retry
            </button>
          </div>
        );
      }}
    >
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <Spinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading route...</p>
          </div>
        }
      >
        <Routes>
          {routes.map(({ path, component: Component, permissions = [] }, idx) => {
            const routeKey = `route-${isProtected}-${path}`;
            debugLog(
              `Mounting route: ${path}`,
              { isProtected, permissions },
              "debug",
              routeKey
            );

            return (
              <Route
                key={routeKey}
                path={path}
                element={
                  isProtected ? (
                    <RequireAuth requiredPermissions={permissions}>
                      <Component />
                    </RequireAuth>
                  ) : (
                    <Component />
                  )
                }
              />
            );
          })}

          <Route
            path="*"
            element={
              (() => {
                const fallbackPath = isProtected ? "/dashboard" : "/";
                debugLog(
                  "Fallback redirect triggered",
                  { to: fallbackPath },
                  "debug",
                  `fallback-${isProtected ? "protected" : "public"}`
                );
                return <Navigate to={fallbackPath} replace />;
              })()
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

RouteRenderer.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      component: PropTypes.elementType.isRequired,
      permissions: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  isProtected: PropTypes.bool,
};

export default RouteRenderer;
