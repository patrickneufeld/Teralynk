// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Header.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/components/Header.css"; // ✅ Ensure correct path

const Header = ({ loggedIn, handleLogout }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(loggedIn);

    // ✅ Synchronize state with props and handle any updates
    useEffect(() => {
        setIsAuthenticated(loggedIn);
    }, [loggedIn]);

    // ✅ Render component with robust structure
    return (
        <header className="header">
            <h1 className="title" role="heading" aria-level="1">
                <Link to="/" className="home-link">
                    Teralynk
                </Link>
            </h1>
            <nav aria-label="Main Navigation">
                <ul className="nav">
                    <li>
                        <Link to="/" className="link" aria-label="Go to Home">
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/about" className="link" aria-label="Learn more About us">
                            About
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact" className="link" aria-label="Contact us">
                            Contact
                        </Link>
                    </li>

                    {!isAuthenticated ? (
                        <>
                            <li>
                                <Link to="/login" className="link" aria-label="Login to your account">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/signup" className="link" aria-label="Sign up for a new account">
                                    Signup
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/dashboard" className="link" aria-label="Go to your Dashboard">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="link" aria-label="View your Profile">
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link to="/settings" className="link" aria-label="Manage your Settings">
                                    Settings
                                </Link>
                            </li>
                            <li>
                                <Link to="/workflows" className="link" aria-label="Check your Workflows">
                                    Workflows
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        try {
                                            handleLogout();
                                            setIsAuthenticated(false);
                                        } catch (error) {
                                            console.error("❌ Logout failed:", error);
                                            alert("An error occurred while logging out.");
                                        }
                                    }}
                                    className="logoutButton"
                                    aria-label="Logout from your account"
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

// ✅ PropTypes validation ensures correctness and prevents runtime errors
Header.propTypes = {
    loggedIn: PropTypes.bool.isRequired,
    handleLogout: PropTypes.func.isRequired,
};

export default Header;
