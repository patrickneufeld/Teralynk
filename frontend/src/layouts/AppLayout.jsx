// ================================================
// ✅ FILE: /frontend/src/layouts/AppLayout.jsx
// Fully responsive App Layout with header, sidebar, main, footer
// ================================================

import React, { memo, useEffect } from "react";
import clsx from "clsx";

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
      {header && (
        <header className="app-layout__header" role="banner">
          {header}
        </header>
      )}

      <div className="app-layout__body" role="presentation">
        {sidebar && (
          <aside className="app-layout__sidebar" role="complementary">
            {sidebar}
          </aside>
        )}
        <main className="app-layout__main" role="main">
          {children}
        </main>
      </div>

      {footer && (
        <footer className="app-layout__footer" role="contentinfo">
          {footer}
        </footer>
      )}
    </div>
  );
});

AppLayout.displayName = "AppLayout";

// ✅ Layout Styles (Scoped, Responsive, Dark Mode)
const layoutStyles = `
  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background-color: var(--bg-app, #ffffff);
    color: var(--text-app, #1e293b);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .app-layout__header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: var(--header-bg, #ffffff);
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    padding: 0.75rem 1.25rem;
    flex-shrink: 0;
  }

  .app-layout__body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .app-layout__sidebar {
    width: 260px;
    background-color: var(--sidebar-bg, #f8fafc);
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    padding: 1rem;
    flex-shrink: 0;
  }

  .app-layout__main {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background-color: var(--main-bg, #ffffff);
  }

  .app-layout__footer {
    flex-shrink: 0;
    background-color: var(--footer-bg, #f1f5f9);
    border-top: 1px solid #e2e8f0;
    padding: 0.75rem 1.25rem;
    text-align: center;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .app-layout__sidebar::-webkit-scrollbar,
  .app-layout__main::-webkit-scrollbar {
    width: 8px;
  }

  .app-layout__sidebar::-webkit-scrollbar-thumb,
  .app-layout__main::-webkit-scrollbar-thumb {
    background-color: rgba(100, 116, 139, 0.4);
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .app-layout__body {
      flex-direction: column;
    }

    .app-layout__sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
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
      color: #f8f9fa;
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
