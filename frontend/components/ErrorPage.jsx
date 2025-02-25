// File Path: frontend/components/ErrorPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ErrorPage.css'; // Updated path for CSS file

const ErrorPage = ({ errorCode = 404, errorMessage = "Page Not Found" }) => {
    const isCriticalError = errorCode >= 500; // Check if the error is a server-side issue

    return (
        <div className="error-page" role="alert" aria-live="polite">
            <h1>Error {errorCode}</h1>
            <p>{errorMessage}</p>
            <div className="error-actions">
                <Link to="/" className="back-home-btn">Back to Home</Link>
                {isCriticalError && (
                    <a href="mailto:support@teralynk.com" className="contact-support-btn">
                        Contact Support
                    </a>
                )}
            </div>
        </div>
    );
};

export default ErrorPage;
