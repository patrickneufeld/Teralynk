// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Footer.jsx

import React from "react";
import "../styles/components/Footer.css"; // ✅ Ensure correct path to styles

const Footer = () => {
    return (
        <footer className="footer" aria-label="Teralynk Footer">
            <p>
                &copy; {new Date().getFullYear()} <strong>Teralynk</strong>. All rights reserved.
            </p>
        </footer>
    );
};

export default Footer;
