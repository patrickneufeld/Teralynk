// File Path: frontend/components/Navbar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navbar.css'; // Updated path to match the styles directory

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <NavLink to="/" aria-label="Go to Teralynk homepage">
                    Teralynk
                </NavLink>
            </div>
            <ul className="navbar-links">
                <li>
                    <NavLink to="/dashboard" activeClassName="active">
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/profile" activeClassName="active">
                        Profile
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/settings" activeClassName="active">
                        Settings
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/help" activeClassName="active">
                        Help
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/logout" activeClassName="active">
                        Logout
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
