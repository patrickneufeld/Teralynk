// ================================================
// ✅ FILE: /frontend/src/components/Header.jsx
// Responsive, accessible, role-aware Teralynk Header
// ================================================

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts";
import "../styles/components/Header.css"; // Ensure Tailwind/PostCSS is loaded

// Optional: import these if you have theme/notification components
// import NotificationBell from "@/components/NotificationBell";
// import ThemeToggle from "@/components/ThemeToggle";

const Header = () => {
  const navigate = useNavigate();
  const { currentUser, logout, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!isLoading && !!currentUser?.id);
  }, [currentUser, isLoading]);

  const handleLogoutClick = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      alert("An error occurred during logout. Please try again.");
    }
  };

  return (
    <header
      className="header shadow-sm bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 z-50"
      role="banner"
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-blue-600">
          <Link to="/" aria-label="Teralynk Home">
            Teralynk
          </Link>
        </h1>
      </div>

      <nav className="text-sm font-medium flex items-center gap-6" aria-label="Main Navigation">
        <ul className="flex flex-wrap items-center gap-4">
          <li>
            <Link to="/" className="hover:underline" aria-label="Home">
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:underline" aria-label="About">
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:underline" aria-label="Contact">
              Contact
            </Link>
          </li>

          {!isAuthenticated ? (
            <>
              <li>
                <Link to="/login" className="hover:underline text-blue-600 font-medium" aria-label="Login">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:underline text-blue-600 font-medium" aria-label="Signup">
                  Signup
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/dashboard" className="hover:underline" aria-label="Dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:underline" aria-label="Profile">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:underline" aria-label="Settings">
                  Settings
                </Link>
              </li>
              <li>
                <Link to="/workflows" className="hover:underline" aria-label="Workflows">
                  Workflows
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogoutClick}
                  className="text-red-600 hover:underline font-semibold focus:outline-none"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>

        {/* 🔒 Show these only when logged in */}
        {isAuthenticated && (
          <div className="flex items-center gap-4 ml-6">
            {/* <NotificationBell /> */}
            {/* <ThemeToggle /> */}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
