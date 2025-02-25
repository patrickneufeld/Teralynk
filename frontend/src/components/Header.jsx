// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Header.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/components/Header.css"; // ✅ Ensure correct path

const Header = ({ loggedIn, handleLogout }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(loggedIn);

    // ✅ Update authentication state when `loggedIn` changes
    useEffect(() => {
        setIsAuthenticated(loggedIn);
    }, [loggedIn]);

    return (
        <header className="header">
            <h1 className="title">Teralynk</h1>
            <nav>
                <ul className="nav">
                    <li><Link to="/" className="link">Home</Link></li>
                    <li><Link to="/about" className="link">About</Link></li>
                    <li><Link to="/contact" className="link">Contact</Link></li>

                    {!isAuthenticated ? (
                        <>
                            <li><Link to="/login" className="link">Login</Link></li>
                            <li><Link to="/signup" className="link">Signup</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/dashboard" className="link">Dashboard</Link></li>
                            <li><Link to="/profile" className="link">Profile</Link></li>
                            <li><Link to="/settings" className="link">Settings</Link></li>
                            <li><Link to="/workflows" className="link">Workflows</Link></li>
                            <li>
                                <button 
                                    onClick={() => {
                                        handleLogout();
                                        setIsAuthenticated(false);
                                    }} 
                                    className="logoutButton"
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

// ✅ PropTypes for validation
Header.propTypes = {
    loggedIn: PropTypes.bool.isRequired,
    handleLogout: PropTypes.func.isRequired,
};

export default Header;
