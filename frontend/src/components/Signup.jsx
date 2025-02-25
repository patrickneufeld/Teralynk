// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Signup.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // ✅ Correct API client path
import "../styles/components/Signup.css";

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        confirmationCode: '',
    });

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });

        if (e.target.name === "password" || e.target.name === "confirmPassword") {
            validatePassword(formData.password, formData.confirmPassword);
        }
    };

    // ✅ Password validation
    const validatePassword = (password, confirmPassword) => {
        if (password.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            return false;
        }
        if (!/[A-Z]/.test(password)) {
            setPasswordError("Password must contain at least one uppercase letter.");
            return false;
        }
        if (!/[a-z]/.test(password)) {
            setPasswordError("Password must contain at least one lowercase letter.");
            return false;
        }
        if (!/[0-9]/.test(password)) {
            setPasswordError("Password must contain at least one number.");
            return false;
        }
        if (!/[!@#$%^&*]/.test(password)) {
            setPasswordError("Password must contain at least one special character (!@#$%^&*).");
            return false;
        }
        if (password !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return false;
        }
        setPasswordError("");
        return true;
    };

    // ✅ Handle Signup
    const handleSignup = async () => {
        setLoading(true);
        setError('');

        if (!validatePassword(formData.password, formData.confirmPassword)) {
            setLoading(false);
            return;
        }

        try {
            await apiClient.post('/auth/signup', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
            });
            setIsConfirmed(true); // Move to confirmation step
        } catch (err) {
            console.error('❌ Signup failed:', err);
            setError(err.response?.data?.message || 'Signup failed. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Confirmation of Signup
    const handleConfirmSignup = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/confirm-signup', {
                username: formData.username,
                confirmationCode: formData.confirmationCode,
            });

            localStorage.setItem('token', response.data.token); // Store JWT token after confirmation
            navigate('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            console.error('❌ Confirmation failed:', err);
            setError(err.response?.data?.message || 'Confirmation failed. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h2>Signup</h2>
            {error && <p className="error">{error}</p>}
            {!isConfirmed ? (
                <>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                    {passwordError && <p className="error">{passwordError}</p>}
                    <button onClick={handleSignup} disabled={loading}>
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        name="confirmationCode"
                        placeholder="Confirmation Code"
                        value={formData.confirmationCode}
                        onChange={handleChange}
                        required
                    />
                    <button onClick={handleConfirmSignup} disabled={loading}>
                        {loading ? 'Confirming...' : 'Confirm Signup'}
                    </button>
                </>
            )}
        </div>
    );
};

export default Signup;
