// ✅ FILE: frontend/src/components/Login.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import '../styles/components/Login.css'; // Importing the CSS for Login component

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: email, password }),
                credentials: 'include', // To include cookies if needed
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed.');
            }

            // ✅ Store authentication tokens in localStorage
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('idToken', data.idToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            onLogin(); // Invoke onLogin callback from parent component
            navigate('/dashboard'); // Redirect user to dashboard
        } catch (err) {
            console.error('❌ Login Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <div className="error-message">⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

Login.propTypes = {
    onLogin: PropTypes.func.isRequired, // Function to run after login is successful
};

export default Login;
