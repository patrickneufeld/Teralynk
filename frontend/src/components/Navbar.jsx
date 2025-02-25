// /Users/patrick/Projects/Teralynk/frontend/src/components/Navbar.jsx

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "../styles/components/Navbar.css";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <div className="navbar-logo">
                    <NavLink to="/" className="navbar-brand" aria-label="Go to Teralynk homepage">
                        Teralynk
                    </NavLink>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="menu-toggle"
                    onClick={toggleMenu}
                    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                >
                    {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>

                {/* Navigation Links */}
                <ul className={`navbar-links ${isOpen ? "open" : ""}`}>
                    <li>
                        <NavLink
                            to="/dashboard"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            Profile
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            Settings
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/help"
                            className={({ isActive }) => (isActive ? "active" : "")}
                        >
                            Help
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/logout"
                            className={({ isActive }) => (isActive ? "active logout" : "logout")}
                        >
                            Logout
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
