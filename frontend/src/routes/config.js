// ================================================
// ✅ FILE: /frontend/src/routes/config.js
// Enterprise Route Configuration - Fixed Version
// ================================================

import { lazy } from "react";
import { logError, logWarn } from "@/utils/logging";

// --- Safe Component Loader with Better Error Handling ---
const safeLazy = (importFn, componentName = "Unknown") => {
  return lazy(() =>
    importFn().catch((error) => {
      // Use warning instead of error for expected failures
      logWarn(`Component ${componentName} loading failed:`, { error });
      
      // Return a more user-friendly fallback component
      return {
        default: () => (
          <div 
            role="alert" 
            className="p-4 m-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700"
          >
            <h3 className="font-medium mb-2">Component Unavailable</h3>
            <p>This feature is currently unavailable or under development.</p>
          </div>
        ),
      };
    })
  );
};

// --- Page Components with Named Components for Better Error Messages ---
const pages = {
  // Public Pages
  public: {
    Home: safeLazy(() => import("@/components/Home"), "Home"),
    About: safeLazy(() => import("@/components/About"), "About"),
    Login: safeLazy(() => import("@/components/Login"), "Login"),
    Signup: safeLazy(() => import("@/components/Signup"), "Signup"),
    ResetPassword: safeLazy(() => import("@/components/ResetPassword"), "ResetPassword"),
    ConfirmReset: safeLazy(() => import("@/components/ConfirmResetPassword"), "ConfirmReset"),
    John316: safeLazy(() => import("@/pages/JOHN316"), "John316"),
  },

  // Dashboard Pages
  dashboard: {
    Dashboard: safeLazy(() => import("@/components/Dashboard"), "Dashboard"),
    AdminDashboard: safeLazy(() => import("@/components/AdminDashboard"), "AdminDashboard"),
    Insights: safeLazy(() => import("@/components/Insights"), "Insights"),
    Performance: safeLazy(() => import("@/components/PerformanceDashboard"), "PerformanceDashboard"),
  },

  // AI Pages
  ai: {
    Workbench: safeLazy(() => import("@/components/AIWorkbench"), "AIWorkbench"),
    Analytics: safeLazy(() => import("@/components/AIAnalytics"), "AIAnalytics"),
    Assistant: safeLazy(() => import("@/components/AIAssistant"), "AIAssistant"),
    Benchmark: safeLazy(() => import("@/components/AIBenchmark"), "AIBenchmark"),
    Performance: safeLazy(() => import("@/components/AiPerformanceLogs"), "AiPerformanceLogs"),
    Recommendations: safeLazy(() => import("@/components/AIRecommendations"), "AIRecommendations"),
    Training: safeLazy(() => import("@/components/AITrainingPanel"), "AITrainingPanel"),
  },

  // Storage Pages
  storage: {
    FileManager: safeLazy(() => import("@/components/FileManager"), "FileManager"),
    S3Explorer: safeLazy(() => import("@/components/S3FileExplorer"), "S3FileExplorer"),
    FileUpload: safeLazy(() => import("@/components/FileUpload"), "FileUpload"),
    AddStorage: safeLazy(() => import("@/components/AddStorage"), "AddStorage"),
    StorageManager: safeLazy(() => import("@/components/StorageManager"), "StorageManager"),
  },

  // Account Pages
  account: {
    Profile: safeLazy(() => import("@/components/Profile"), "Profile"),
    Settings: safeLazy(() => import("@/components/Settings"), "Settings"),
    Notifications: safeLazy(() => import("@/components/Notifications"), "Notifications"),
  },

  // System Pages
  system: {
    AuditLog: safeLazy(() => import("@/components/AuditLog"), "AuditLog"),
    TeamManagement: safeLazy(() => import("@/components/TeamManagement"), "TeamManagement"),
    Marketplace: safeLazy(() => import("@/components/Marketplace"), "Marketplace"),
    Help: safeLazy(() => import("@/components/Help"), "Help"),
    Contact: safeLazy(() => import("@/components/Contact"), "Contact"),
    Onboarding: safeLazy(() => import("@/components/Onboarding"), "Onboarding"),
    Collaboration: safeLazy(() => import("@/components/Collaboration"), "Collaboration"),
  },
};

// --- Permissions ---
export const PERMISSIONS = {
  USER: "user",
  ADMIN: "admin",
  AI_READ: "ai:read",
  AI_USE: "ai:use",
  AI_TRAIN: "ai:train",
  STORAGE_READ: "storage:read",
  STORAGE_WRITE: "storage:write",
};

// --- Route Configuration ---
const routeConfig = {
  // Public Routes
  public: [
    { path: "/", name: "Home", element: pages.public.Home },
    { path: "/about", name: "About", element: pages.public.About },
    { path: "/login", name: "Login", element: pages.public.Login },
    { path: "/signup", name: "Signup", element: pages.public.Signup },
    { path: "/reset", name: "Reset Password", element: pages.public.ResetPassword },
    { path: "/confirm-reset", name: "Confirm Reset", element: pages.public.ConfirmReset },
    { path: "/john316", name: "John 3:16", element: pages.public.John316 },
  ],

  // Protected Routes
  protected: {
    // Dashboard Routes
    dashboard: [
      {
        path: "/dashboard",
        name: "Dashboard",
        element: pages.dashboard.Dashboard,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/admin-dashboard",
        name: "Admin Dashboard",
        element: pages.dashboard.AdminDashboard,
        permissions: [PERMISSIONS.ADMIN],
      },
      {
        path: "/insights",
        name: "Insights",
        element: pages.dashboard.Insights,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/performance",
        name: "Performance",
        element: pages.dashboard.Performance,
        permissions: [PERMISSIONS.ADMIN],
      },
    ],

    // AI Routes
    ai: [
      {
        path: "/ai",
        name: "AI Workbench",
        element: pages.ai.Workbench,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/ai-analytics",
        name: "AI Analytics",
        element: pages.ai.Analytics,
        permissions: [PERMISSIONS.AI_READ],
      },
      {
        path: "/ai-assistant",
        name: "AI Assistant",
        element: pages.ai.Assistant,
        permissions: [PERMISSIONS.AI_USE],
      },
      {
        path: "/ai-benchmark",
        name: "AI Benchmark",
        element: pages.ai.Benchmark,
        permissions: [PERMISSIONS.AI_READ],
      },
      {
        path: "/ai-performance",
        name: "AI Performance Logs",
        element: pages.ai.Performance,
        permissions: [PERMISSIONS.AI_READ],
      },
      {
        path: "/ai-recommendations",
        name: "AI Recommendations",
        element: pages.ai.Recommendations,
        permissions: [PERMISSIONS.AI_USE],
      },
      {
        path: "/ai-training",
        name: "AI Training",
        element: pages.ai.Training,
        permissions: [PERMISSIONS.AI_TRAIN],
      },
    ],

    // Storage Routes
    storage: [
      {
        path: "/files",
        name: "Files",
        element: pages.storage.FileManager,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/storage",
        name: "S3 Storage",
        element: pages.storage.S3Explorer,
        permissions: [PERMISSIONS.STORAGE_READ],
      },
      {
        path: "/upload",
        name: "File Upload",
        element: pages.storage.FileUpload,
        permissions: [PERMISSIONS.STORAGE_WRITE],
      },
      {
        path: "/add-storage",
        name: "Add Storage",
        element: pages.storage.AddStorage,
        permissions: [PERMISSIONS.STORAGE_WRITE],
      },
      {
        path: "/storage-manager",
        name: "Storage Manager",
        element: pages.storage.StorageManager,
        permissions: [PERMISSIONS.ADMIN],
      },
    ],

    // Account Routes
    account: [
      {
        path: "/profile",
        name: "Profile",
        element: pages.account.Profile,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/settings",
        name: "Settings",
        element: pages.account.Settings,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/notifications",
        name: "Notifications",
        element: pages.account.Notifications,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
    ],

    // System Routes
    system: [
      {
        path: "/audit-log",
        name: "Audit Log",
        element: pages.system.AuditLog,
        permissions: [PERMISSIONS.ADMIN],
      },
      {
        path: "/team",
        name: "Team Management",
        element: pages.system.TeamManagement,
        permissions: [PERMISSIONS.ADMIN],
      },
      {
        path: "/marketplace",
        name: "Marketplace",
        element: pages.system.Marketplace,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/help",
        name: "Help",
        element: pages.system.Help,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/contact",
        name: "Contact",
        element: pages.system.Contact,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
      {
        path: "/onboarding",
        name: "Onboarding",
        element: pages.system.Onboarding,
        permissions: [PERMISSIONS.ADMIN],
      },
      {
        path: "/collaboration",
        name: "Collaboration",
        element: pages.system.Collaboration,
        permissions: [PERMISSIONS.USER, PERMISSIONS.ADMIN],
      },
    ],
  },
};

export default routeConfig;
