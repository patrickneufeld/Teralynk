import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import Marketplace from "./components/Marketplace";
import StorageManager from "./components/StorageManagement"; // ✅ Fixed
import AIQuery from "./components/AITools"; // ✅ Fixed
import Troubleshooting from "./components/Troubleshooting";
import AdminDashboard from "./components/AdminDashboard";
import Notifications from "./components/Notifications";
import PerformanceDashboard from "./components/PerformanceDashboard";
import OptimizationApproval from "./components/OptimizationApproval"; // ✅ Fixed
import Header from "./components/Header";
import Footer from "./components/Footer";

// ✅ Styles Import (Fixed Paths)
import "./styles/global/index.css";
import "./styles/components/About.css";
import "./styles/components/Contact.css";
import "./styles/components/Dashboard.css";
import "./styles/components/Profile.css";
import "./styles/components/Settings.css";
import "./styles/components/Login.css";
import "./styles/components/Footer.css";
import "./styles/components/Signup.css";
import "./styles/components/Marketplace.css"; // ✅ Fixed
import "./styles/components/StorageManagement.css"; // ✅ Fixed
import "./styles/components/Admin.css";
import "./styles/components/Troubleshooting.css";
import "./styles/components/Notifications.css";
import "./styles/components/PerformanceDashboard.css";
import "./styles/components/OptimizationApproval.css"; // ✅ Fixed

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

function App() {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}

function MainApp() {
    const { loggedIn, user, loading, checkAuthStatus, handleLogout } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

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
                        <Route path="/login" element={!loggedIn ? <Login /> : <Navigate to="/dashboard" />} />
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
                                <Route path="/marketplace" element={<Marketplace />} />
                                <Route path="/storage" element={<StorageManager />} />
                                <Route path="/ai-integration" element={<AIQuery />} />
                                <Route path="/troubleshoot" element={<Troubleshooting />} />
                                <Route path="/notifications" element={<Notifications />} />
                                <Route path="/performance" element={<PerformanceDashboard />} />
                                <Route path="/optimizations" element={<OptimizationApproval />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <Footer />
        </div>
    );
}

export default App;
