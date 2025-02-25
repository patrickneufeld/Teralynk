// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/pages/Auth/Login.jsx

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.username, formData.password);
        } catch (err) {
            setError("Invalid username or password.");
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
