// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // API base URL (for development environment)
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // Handle Signup
    const handleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            await axios.post(`${API_BASE_URL}/auth/signup`, { username, password, email });
            setIsConfirmed(true); // Move to confirmation step
        } catch (err) {
            const message = err.response?.data?.message || 'Signup failed. Please check your information.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Confirmation of Signup
    const handleConfirmSignup = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/confirm-signup`, { username, confirmationCode });
            localStorage.setItem('token', response.data.token); // Store JWT token after confirmation
            navigate('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            const message = err.response?.data?.message || 'Confirmation failed. Please check the code.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Signup</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!isConfirmed ? (
                <>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button onClick={handleSignup} disabled={loading}>
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        placeholder="Confirmation Code"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
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
