// ================================================
// ✅ FILE: /frontend/src/layouts/Header.jsx
// Enterprise Header with Auth + Theme Context
// ================================================

import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = ({ onMenuToggle }) => {
  const { user, loggedIn, logout } = useAuth();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div className="logo" style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Teralynk</Link>
      </div>

      <div className="nav-links" style={{ display: 'flex', gap: '1rem' }}>
        {loggedIn && (
          <>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</Link>
            <Link to="/files" style={{ textDecoration: 'none', color: '#333' }}>Files</Link>
            <Link to="/upload" style={{ textDecoration: 'none', color: '#333' }}>Upload</Link>
            <Link to="/storage" style={{ textDecoration: 'none', color: '#333' }}>Storage</Link>
          </>
        )}
      </div>

      <div className="controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {loggedIn ? (
          <>
            <span style={{ marginRight: '1rem' }}>
              {user?.name || user?.email || 'User'}
            </span>
            <button 
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link 
            to="/login"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
