// ================================================
// ✅ FILE: /frontend/src/layouts/Footer.jsx
// Simple Footer Component
// ================================================

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e9ecef',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Teralynk. All rights reserved.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/about" style={{ textDecoration: 'none', color: '#6c757d' }}>About</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: '#6c757d' }}>Contact</Link>
          <Link to="/help" style={{ textDecoration: 'none', color: '#6c757d' }}>Help</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
