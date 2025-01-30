// File Path: frontend/components/Signup.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css'; // Updated path for the CSS file

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true); // Start loading
        setError(''); // Clear any previous errors

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                navigate('/dashboard'); // Redirect to dashboard on successful signup
            } else {
                const { message } = await response.json();
                setError(message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    const handleSocialSignup = (provider) => {
        window.location.href = `/auth/${provider}`; // Redirect for social signup
    };

    return (
        <div className="signup-form">
            <h2>Create Your Account</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength="8"
                        placeholder="At least 8 characters"
                    />
                </label>
                <label>
                    Confirm Password:
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength="8"
                        placeholder="Re-enter your password"
                    />
                </label>
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <div className="social-signup">
                <p>Or sign up with:</p>
                <button onClick={() => handleSocialSignup('google')} disabled={loading}>
                    Google
                </button>
                <button onClick={() => handleSocialSignup('github')} disabled={loading}>
                    GitHub
                </button>
            </div>
        </div>
    );
};

export default Signup;
