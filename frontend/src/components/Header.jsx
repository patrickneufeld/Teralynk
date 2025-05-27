// ✅ FILE: /frontend/src/components/Header.jsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../contexts/AuthContext";
import "../styles/components/Header.css"; // ✅ Ensure this file exists and is loaded via Tailwind/PostCSS

const Header = () => {
  const navigate = useNavigate();
  const { loggedIn, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(loggedIn);

  useEffect(() => {
    setIsAuthenticated(loggedIn);
  }, [loggedIn]);

  const handleLogoutClick = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      navigate("/login");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      alert("An error occurred during logout. Please try again.");
    }
  };

  return (
    <header className="header shadow-md bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-tight text-blue-600">
        <Link to="/" aria-label="Teralynk Home">
          Teralynk
        </Link>
      </h1>

      <nav className="text-sm font-medium" aria-label="Main Navigation">
        <ul className="flex flex-wrap gap-4 items-center">
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
                <Link to="/login" className="hover:underline" aria-label="Login">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:underline" aria-label="Signup">
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
                  className="text-red-600 hover:underline font-semibold"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

Header.propTypes = {};

export default Header;
