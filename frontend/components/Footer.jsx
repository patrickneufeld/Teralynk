// File Path: frontend/components/Footer.jsx

import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} Teralynk. All Rights Reserved.</p>
                <ul className="footer-links">
                    <li><a href="/terms" aria-label="Terms of Service">Terms of Service</a></li>
                    <li><a href="/privacy" aria-label="Privacy Policy">Privacy Policy</a></li>
                    <li><a href="/contact" aria-label="Contact Us">Contact Us</a></li>
                </ul>
                <div className="social-media">
                    <a 
                        href="https://twitter.com/teralynk" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Follow us on Twitter"
                    >
                        Twitter
                    </a>
                    <a 
                        href="https://facebook.com/teralynk" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Follow us on Facebook"
                    >
                        Facebook
                    </a>
                    <a 
                        href="https://linkedin.com/company/teralynk" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label="Follow us on LinkedIn"
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
