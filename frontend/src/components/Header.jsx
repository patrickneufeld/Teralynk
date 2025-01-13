// File Path: frontend/src/components/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const Header = ({ loggedIn, handleLogout }) => {
    return (
        <header style={styles.header}>
            <h1 style={styles.title}>Teralynk</h1>
            <nav>
                <ul style={styles.nav}>
                    <li><Link to="/" style={styles.link}>Home</Link></li>
                    <li><Link to="/about" style={styles.link}>About</Link></li>
                    <li><Link to="/contact" style={styles.link}>Contact</Link></li>
                    {!loggedIn ? (
                        <>
                            <li><Link to="/login" style={styles.link}>Login</Link></li>
                            <li><Link to="/signup" style={styles.link}>Signup</Link></li>
                        </>
                    ) : (
                        <>
                            <li><Link to="/dashboard" style={styles.link}>Dashboard</Link></li>
                            <li><Link to="/profile" style={styles.link}>Profile</Link></li>
                            <li><Link to="/settings" style={styles.link}>Settings</Link></li>
                            <li><Link to="/workflows" style={styles.link}>Workflows</Link></li>
                            <li>
                                <button onClick={handleLogout} style={styles.logoutButton}>
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

// PropTypes for validation
Header.propTypes = {
    loggedIn: PropTypes.bool.isRequired,
    handleLogout: PropTypes.func.isRequired,
};

// Inline styles for simplicity
const styles = {
    header: {
        backgroundColor: '#f4f4f4',
        padding: '1rem',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        margin: 0,
        color: '#333',
    },
    nav: {
        listStyle: 'none',
        display: 'flex',
        gap: '1rem',
        padding: 0,
        margin: 0,
    },
    link: {
        textDecoration: 'none',
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderRadius: '4px',
    },
};

export default Header;
