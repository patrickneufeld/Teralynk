// File Path: frontend/components/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Updated path to match the styles directory

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true); // Start loading
        setError(''); // Clear previous errors

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                navigate('/dashboard'); // Redirect to the dashboard on success
            } else {
                const { message } = await response.json();
                setError(message || 'Invalid email or password. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleSocialLogin = (provider) => {
        window.location.href = `/auth/${provider}`; // Redirect to social login provider
    };

    return (
        <div className="login-form">
            <h2>Welcome Back</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <div className="social-login">
                <p>Or log in with:</p>
                <button onClick={() => handleSocialLogin('google')} aria-label="Log in with Google">
                    Google
                </button>
                <button onClick={() => handleSocialLogin('github')} aria-label="Log in with GitHub">
                    GitHub
                </button>
            </div>
            <p className="signup-redirect">
                Don't have an account? <a href="/signup" aria-label="Sign up here">Sign up here</a>.
            </p>
        </div>
    );
};

export default Login;
