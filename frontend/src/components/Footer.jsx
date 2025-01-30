// File Path: frontend/src/components/Footer.jsx

import React from 'react';
import './Footer.css'; // Importing the CSS for Footer component

const Footer = () => {
    return (
        <footer className="footer">
            <p>&copy; {new Date().getFullYear()} Teralynk. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
