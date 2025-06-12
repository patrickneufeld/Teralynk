// ================================================
// ✅ FILE: /frontend/src/components/Navbar.jsx
// Responsive Navbar with Role-Aware Auth Actions
// ================================================

import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts";
import "@/styles/components/Navbar.css";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { loggedIn, logout } = useAuth();

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <nav className="navbar bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 z-50 relative">
      <div className="navbar-container flex items-center justify-between">
        {/* Logo */}
        <div className="navbar-logo text-xl font-bold text-blue-600">
          <NavLink to="/" aria-label="Go to Teralynk homepage">
            Teralynk
          </NavLink>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="menu-toggle lg:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        {/* Navigation Links */}
        <ul
          className={`navbar-links flex flex-col lg:flex-row gap-4 lg:gap-6 absolute lg:static top-16 left-0 w-full lg:w-auto bg-white dark:bg-gray-900 px-6 lg:px-0 py-4 lg:py-0 transition-all duration-300 ease-in-out ${
            isOpen ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Common Links */}
          <li>
            <NavLink to="/" className="hover:underline" aria-label="Home">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className="hover:underline" aria-label="About">
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className="hover:underline" aria-label="Contact">
              Contact
            </NavLink>
          </li>

          {!loggedIn ? (
            <>
              {/* Logged-out links */}
              <li>
                <NavLink to="/login" className="hover:underline" aria-label="Login">
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/signup" className="hover:underline" aria-label="Signup">
                  Signup
                </NavLink>
              </li>
            </>
          ) : (
            <>
              {/* Logged-in links */}
              <li>
                <NavLink to="/dashboard" className="hover:underline" aria-label="Dashboard">
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className="hover:underline" aria-label="Profile">
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className="hover:underline" aria-label="Settings">
                  Settings
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400 font-semibold hover:underline focus:outline-none"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
