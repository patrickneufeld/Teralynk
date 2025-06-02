// ✅ FILE: /frontend/src/layouts/Sidebar.jsx

import React, { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import routeConfig from "../routes/config.js";
import SidebarItem from "../components/layout/SidebarItem";
import {
  LayoutDashboard,
  ShieldCheck,
  Folder,
  PlusCircle,
  BrainCircuit,
  Bot,
  FileBox,
  Settings,
  CircleHelp,
  ChevronDown,
  ChevronRight,
  BookText,
} from "lucide-react";
import clsx from "clsx";

// ✅ Map route names to Lucide icons
const iconMap = {
  Dashboard: LayoutDashboard,
  "Admin Dashboard": ShieldCheck,
  "File Explorer": Folder,
  "Add Storage": PlusCircle,
  "AI Analytics": BrainCircuit,
  "AI Assistant": Bot,
  "Storage Manager": FileBox,
  Settings: Settings,
  Help: CircleHelp,
  "John 3:16": BookText,
};

// ✅ Public routes where sidebar should be hidden
const HIDE_SIDEBAR_ROUTES = ["/login", "/signup", "/reset"];

const Sidebar = () => {
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // ❌ Do not render sidebar on auth or setup pages
  if (HIDE_SIDEBAR_ROUTES.includes(location.pathname)) return null;

  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const isGroupActive = (routes = []) =>
    routes.some((r) => location.pathname.startsWith(r.path));

  const renderRouteGroup = (groupName, routes = []) => {
    if (!routes.length) return null;

    const groupLabel =
      groupName.charAt(0).toUpperCase() +
      groupName.slice(1).replace(/([A-Z])/g, " $1");

    const active = isGroupActive(routes);
    const collapsed = collapsedGroups[groupName] && !active;

    return (
      <div key={groupName}>
        <button
          onClick={() => toggleGroup(groupName)}
          className={clsx(
            "w-full flex justify-between items-center text-xs font-semibold px-2 mb-1 uppercase tracking-wide text-left",
            active ? "text-blue-600" : "text-gray-500 dark:text-gray-400"
          )}
          aria-expanded={!collapsed}
          aria-controls={`sidebar-group-${groupName}`}
        >
          {groupLabel}
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {!collapsed && (
          <div
            id={`sidebar-group-${groupName}`}
            className="space-y-1 mb-4"
            role="group"
          >
            {routes.map(({ path, name }) => (
              <SidebarItem
                key={path}
                to={path}
                label={name}
                icon={iconMap[name] || CircleHelp}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const protectedRouteGroups = useMemo(
    () => Object.entries(routeConfig.protected || {}),
    []
  );

  const publicRoutes = useMemo(() => routeConfig.public || [], []);

  return (
    <aside className="h-full w-full p-4 space-y-4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="text-lg font-semibold text-gray-800 dark:text-white px-2">
        Navigation
      </div>

      {/* ✅ Public Section */}
      <div className="mb-4">
        <div className="text-xs font-semibold px-2 mb-1 uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Public
        </div>
        <div className="space-y-1">
          {publicRoutes.map(({ path, name }) => (
            <SidebarItem
              key={path}
              to={path}
              label={name}
              icon={iconMap[name] || CircleHelp}
            />
          ))}
        </div>
      </div>

      {/* ✅ Protected Groups */}
      {protectedRouteGroups.map(([groupName, routes]) =>
        renderRouteGroup(groupName, routes)
      )}
    </aside>
  );
};

export default Sidebar;
