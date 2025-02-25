// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Login from "./components/Login";
import Signup from "./components/Signup";
import WorkflowPage from "./pages/WorkflowPage";
import FileSearch from "./components/FileSearch";
import FileVersioning from "./components/FileVersioning";
import BusinessProposal from "./components/BusinessProposal";
import Header from "./components/Header";
import Footer from "./components/Footer";

// ✅ Fixed Styles Import
import "/src/styles/global/index.css";
import "/src/styles/components/About.css";
import "/src/styles/components/Contact.css";
import "/src/styles/components/Dashboard.css";
import "/src/styles/components/Profile.css";
import "/src/styles/components/Settings.css";
import "/src/styles/components/Login.css";
import "/src/styles/components/Footer.css";
import "/src/styles/components/Signup.css"; 

// ✅ Define BACKEND_URL with a fallback
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    // ✅ Check user authentication status
    const checkAuthStatus = async () => {
        setLoading(true);
        try {
            console.log(`🔍 Checking auth status: ${BACKEND_URL}/api/auth/status`);
            const response = await fetch(`${BACKEND_URL}/api/auth/status`, {
                credentials: "include",
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            });

            if (!response.ok) {
                throw new Error("Authentication check failed.");
            }

            const currentUser = await response.json();
            setLoggedIn(true);
            setUser(currentUser);
        } catch (err) {
            console.error("❌ Auth Check Error:", err.message);
            setLoggedIn(false);
            setUser(null);
            localStorage.removeItem("accessToken");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Login & Store Token
    const handleLogin = async (token) => {
        localStorage.setItem("accessToken", token);
        await checkAuthStatus();
    };

    // ✅ Handle Logout
    const handleLogout = async () => {
        try {
            console.log(`🔍 Logging out: ${BACKEND_URL}/api/auth/logout`);
            const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
            });

            if (!response.ok) {
                throw new Error("Logout failed.");
            }

            localStorage.removeItem("accessToken");
            setLoggedIn(false);
            setUser(null);
        } catch (err) {
            console.error("❌ Logout Error:", err.message);
            setError("An unexpected error occurred during logout.");
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="App">
            <Header loggedIn={loggedIn} handleLogout={handleLogout} />
            
            <div className="main-container">
                <main>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/login" element={!loggedIn ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
                        <Route path="/signup" element={!loggedIn ? <Signup /> : <Navigate to="/dashboard" />} />

                        {loggedIn && (
                            <>
                                <Route path="/dashboard" element={<Dashboard user={user} />} />
                                <Route path="/profile" element={<Profile user={user} />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/workflows" element={<WorkflowPage />} />
                                <Route path="/search" element={<FileSearch />} />
                                <Route path="/versioning" element={<FileVersioning />} />
                                <Route path="/proposal" element={<BusinessProposal />} />
                            </>
                        )}

                        <Route path="*" element={loggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
                    </Routes>
                </main>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <Footer />
        </div>
    );
}

export default App;
