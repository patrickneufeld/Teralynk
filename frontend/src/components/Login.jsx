// File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Handle Login
    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);  // Store JWT token
            navigate('/dashboard');  // Redirect to dashboard on success
        } catch (err) {
            setError('Login failed. Please check your username and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
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
            <button onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </div>
    );
};

export default Login;
