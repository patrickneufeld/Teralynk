// ✅ File: /frontend/src/layouts/AppLayout.jsx

import React, { memo, useEffect } from "react";
import clsx from "clsx";

/**
 * AppLayout – Fully integrated layout for Teralynk
 * Includes sticky header, optional sidebar/footer, responsive design, dark mode, and custom scrollbar.
 */
const AppLayout = memo(({ children, header, sidebar, footer, className = "" }) => {
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("app-layout-styles")) {
      const styleTag = document.createElement("style");
      styleTag.id = "app-layout-styles";
      styleTag.textContent = layoutStyles;
      document.head.appendChild(styleTag);
    }
  }, []);

  return (
    <div className={clsx("app-layout", className)}>
      {header && <header role="banner" className="app-layout__header">{header}</header>}

      <div className="app-layout__content" role="presentation">
        {sidebar && <aside role="complementary" className="app-layout__sidebar">{sidebar}</aside>}
        <main role="main" className="app-layout__main">{children}</main>
      </div>

      {footer && <footer role="contentinfo" className="app-layout__footer">{footer}</footer>}
    </div>
  );
});

AppLayout.displayName = "AppLayout";

// ✅ Scoped Layout Styles (Teralynk-themed)
const layoutStyles = `
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: var(--bg-app, #ffffff);
    color: var(--text-app, #1e293b); /* slate-800 */
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.5;
  }

  .app-layout__header {
    position: sticky;
    top: 0;
    z-index: 100;
    width: 100%;
    background-color: var(--header-bg, #ffffff);
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .app-layout__content {
    display: flex;
    flex: 1;
    min-height: 0;
    background-color: var(--layout-bg, #ffffff);
  }

  .app-layout__sidebar {
    width: 260px;
    background-color: var(--sidebar-bg, #f8fafc);
    border-right: 1px solid #e5e7eb;
    overflow-y: auto;
    padding: 1rem;
    flex-shrink: 0;
  }

  .app-layout__main {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    background-color: var(--main-bg, #ffffff);
  }

  .app-layout__footer {
    margin-top: auto;
    padding: 1rem 1.5rem;
    background-color: var(--footer-bg, #f1f5f9); /* slate-50 */
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280; /* gray-500 */
  }

  .app-layout__sidebar::-webkit-scrollbar,
  .app-layout__main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .app-layout__sidebar::-webkit-scrollbar-thumb,
  .app-layout__main::-webkit-scrollbar-thumb {
    background-color: rgba(100, 116, 139, 0.4); /* slate-500 */
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .app-layout__content {
      flex-direction: column;
    }

    .app-layout__sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .app-layout__main {
      padding: 1rem;
    }

    .app-layout__footer {
      padding: 1rem;
    }
  }

  @media (prefers-color-scheme: dark) {
    .app-layout {
      background-color: #0f172a;
      color: #f1f5f9;
    }

    .app-layout__header {
      background-color: #1e293b;
      border-bottom-color: #334155;
    }

    .app-layout__sidebar {
      background-color: #1e293b;
      border-right-color: #334155;
    }

    .app-layout__main {
      background-color: #0f172a;
    }

    .app-layout__footer {
      background-color: #1e293b;
      border-top-color: #334155;
      color: #94a3b8;
    }

    .app-layout__sidebar::-webkit-scrollbar-thumb,
    .app-layout__main::-webkit-scrollbar-thumb {
      background-color: rgba(203, 213, 225, 0.4);
    }
  }
`;

export default AppLayout;
