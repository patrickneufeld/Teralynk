// File Path: frontend/src/components/Footer.jsx

import React from 'react';

const Footer = () => {
    return (
        <footer style={styles.footer}>
            <p>&copy; {new Date().getFullYear()} Teralynk. All rights reserved.</p>
        </footer>
    );
};

// Inline styles for simplicity
const styles = {
    footer: {
        backgroundColor: '#f4f4f4',
        textAlign: 'center',
        padding: '1rem',
        borderTop: '1px solid #ccc',
        position: 'fixed',
        bottom: 0,
        width: '100%',
    },
    text: {
        margin: 0,
        color: '#666',
    },
};

export default Footer;
