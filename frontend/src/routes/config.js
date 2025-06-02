// File: /frontend/src/routes/config.js

// ─────────────────────────────────────────────
// ✅ PUBLIC ROUTES (No auth required)
// ─────────────────────────────────────────────
import Home from "../components/Home";
import About from "../components/About";
import Login from "../components/Login";
import Signup from "../components/Signup";
import ResetPassword from "../components/ResetPassword";
import ConfirmResetPassword from "../components/ConfirmResetPassword";
import John316 from "../pages/John316";

// ─────────────────────────────────────────────
// ✅ PROTECTED ROUTES (Auth required)
// ─────────────────────────────────────────────
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/AdminDashboard";

import AIWorkbench from "../components/AIWorkbench";
import AIAnalytics from "../components/AIAnalytics";
import AIAssistant from "../components/AIAssistant";
import AIBenchmark from "../components/AIBenchmark";
import AiPerformanceLogs from "../components/AiPerformanceLogs";
import AIRecommendations from "../components/AIRecommendations";
import AITrainingPanel from "../components/AITrainingPanel";

import FileManager from "../components/FileManager";
import S3FileExplorer from "../components/S3FileExplorer";
import AddStorage from "../components/AddStorage";
import StorageManager from "../components/StorageManager";
import FileUpload from "../components/FileUpload";

import Profile from "../components/Profile";
import Settings from "../components/Settings";
import Notifications from "../components/Notifications";

import Marketplace from "../components/Marketplace";
import AuditLog from "../components/AuditLog";
import TeamManagement from "../components/TeamManagement";
import Help from "../components/Help";
import Contact from "../components/Contact";
import Onboarding from "../components/Onboarding";
import Collaboration from "../components/Collaboration";
import Insights from "../components/Insights";
import PerformanceDashboard from "../components/PerformanceDashboard";

// ✅ Route Configuration Object
const routeConfig = {
  public: [
    {
      path: "/",
      name: "Home",
      component: Home,
      exact: true,
      permissions: [],
    },
    {
      path: "/about",
      name: "About",
      component: About,
      permissions: [],
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      permissions: [],
    },
    {
      path: "/signup",
      name: "Signup",
      component: Signup,
      permissions: [],
    },
    {
      path: "/reset",
      name: "Reset Password",
      component: ResetPassword,
      permissions: [],
    },
    {
      path: "/confirm-reset",
      name: "Confirm Reset",
      component: ConfirmResetPassword,
      permissions: [],
    },
    {
      path: "/john316",
      name: "John 3:16",
      component: John316,
      permissions: [],
    },
  ],

  protected: {
    dashboard: [
      {
        path: "/dashboard",
        name: "Dashboard",
        component: Dashboard,
        permissions: ["user", "admin"],
      },
      {
        path: "/admin-dashboard",
        name: "Admin Dashboard",
        component: AdminDashboard,
        permissions: ["admin"],
      },
      {
        path: "/insights",
        name: "Insights",
        component: Insights,
        permissions: ["user", "admin"],
      },
      {
        path: "/performance",
        name: "Performance",
        component: PerformanceDashboard,
        permissions: ["admin"],
      },
    ],

    ai: [
      {
        path: "/ai",
        name: "AI Workbench",
        component: AIWorkbench,
        permissions: ["user", "admin"],
      },
      {
        path: "/ai-analytics",
        name: "AI Analytics",
        component: AIAnalytics,
        permissions: ["ai:read"],
      },
      {
        path: "/ai-assistant",
        name: "AI Assistant",
        component: AIAssistant,
        permissions: ["ai:use"],
      },
      {
        path: "/ai-benchmark",
        name: "AI Benchmark",
        component: AIBenchmark,
        permissions: ["ai:read"],
      },
      {
        path: "/ai-performance",
        name: "AI Performance Logs",
        component: AiPerformanceLogs,
        permissions: ["ai:read"],
      },
      {
        path: "/ai-recommendations",
        name: "AI Recommendations",
        component: AIRecommendations,
        permissions: ["ai:use"],
      },
      {
        path: "/ai-training",
        name: "AI Training",
        component: AITrainingPanel,
        permissions: ["ai:train"],
      },
    ],

    storage: [
      {
        path: "/files",
        name: "Files",
        component: FileManager,
        permissions: ["user", "admin"],
      },
      {
        path: "/storage",
        name: "S3 Storage",
        component: S3FileExplorer,
        permissions: ["storage:read"],
      },
      {
        path: "/upload",
        name: "File Upload",
        component: FileUpload,
        permissions: ["storage:write"],
      },
      {
        path: "/add-storage",
        name: "Add Storage",
        component: AddStorage,
        permissions: ["storage:write"],
      },
      {
        path: "/storage-manager",
        name: "Storage Manager",
        component: StorageManager,
        permissions: ["admin"],
      },
    ],

    account: [
      {
        path: "/profile",
        name: "Profile",
        component: Profile,
        permissions: ["user", "admin"],
      },
      {
        path: "/settings",
        name: "Settings",
        component: Settings,
        permissions: ["user", "admin"],
      },
      {
        path: "/notifications",
        name: "Notifications",
        component: Notifications,
        permissions: ["user", "admin"],
      },
    ],

    system: [
      {
        path: "/audit-log",
        name: "Audit Log",
        component: AuditLog,
        permissions: ["admin"],
      },
      {
        path: "/team",
        name: "Team Management",
        component: TeamManagement,
        permissions: ["admin"],
      },
      {
        path: "/marketplace",
        name: "Marketplace",
        component: Marketplace,
        permissions: ["user", "admin"],
      },
      {
        path: "/help",
        name: "Help",
        component: Help,
        permissions: ["user", "admin"],
      },
      {
        path: "/contact",
        name: "Contact",
        component: Contact,
        permissions: ["user", "admin"],
      },
      {
        path: "/onboarding",
        name: "Onboarding",
        component: Onboarding,
        permissions: ["admin"],
      },
      {
        path: "/collaboration",
        name: "Collaboration",
        component: Collaboration,
        permissions: ["user", "admin"],
      },
    ],
  },
};

export default routeConfig;
