// File Path: frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import WorkflowPage from './pages/WorkflowPage'; // Workflow Management Page
import Header from './components/Header'; // Reusable Header component
import Footer from './components/Footer'; // Reusable Footer component
import './styles/styles.css'; // Global styles

function App() {
    const [loggedIn, setLoggedIn] = useState(false); // Tracks if user is logged in
    const [user, setUser] = useState(null); // Stores current user details
    const [loading, setLoading] = useState(true); // Tracks loading state
    const [error, setError] = useState(null); // Tracks errors

    // On component mount, check authentication status
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Check authentication status with the backend
    const checkAuthStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/status', {
                credentials: 'include', // Include credentials for backend cookies
            });
            if (response.ok) {
                const currentUser = await response.json();
                setLoggedIn(true);
                setUser(currentUser);
                setError(null);
            } else {
                setLoggedIn(false);
                setUser(null);
            }
        } catch (err) {
            setLoggedIn(false);
            setUser(null);
            setError('Failed to check authentication status.');
        } finally {
            setLoading(false);
        }
    };

    // Handle user login
    const handleLogin = async () => {
        await checkAuthStatus();
    };

    // Handle user logout
    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include', // Include credentials for backend cookies
            });
            if (response.ok) {
                setLoggedIn(false);
                setUser(null);
            } else {
                setError('Failed to log out.');
            }
        } catch (err) {
            setError('An unexpected error occurred during logout.');
        }
    };

    // Display a loading state while checking authentication
    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="App">
            {/* Header Section */}
            <Header loggedIn={loggedIn} handleLogout={handleLogout} />

            {/* Main Content */}
            <main>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                        path="/login"
                        element={!loggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
                    />
                    <Route
                        path="/signup"
                        element={!loggedIn ? <Signup /> : <Navigate to="/dashboard" />}
                    />

                    {/* Protected Routes */}
                    {loggedIn && (
                        <>
                            <Route path="/dashboard" element={<Dashboard user={user} />} />
                            <Route path="/profile" element={<Profile user={user} />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/workflows" element={<WorkflowPage />} />
                        </>
                    )}

                    {/* Redirect unauthenticated users */}
                    {!loggedIn && <Route path="*" element={<Navigate to="/login" />} />}
                </Routes>
            </main>

            {/* Error Message */}
            {error && <div className="error">Error: {error}</div>}

            {/* Footer Section */}
            <Footer />
        </div>
    );
}

export default App;
