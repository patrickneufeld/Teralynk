import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient'; // ✅ Ensure correct API path
import '../styles/components/Signup.css'; // ✅ Correct CSS path

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // ✅ Handle input changes dynamically
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ Validate form before submitting
    const validateForm = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError("⚠️ All fields are required.");
            return false;
        }

        if (formData.password.length < 8) {
            setError("⚠️ Password must be at least 8 characters long.");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("⚠️ Passwords do not match.");
            return false;
        }

        return true;
    };

    // ✅ Handle signup submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) return; // 🚀 Prevent invalid form submission

        setLoading(true);
        try {
            const response = await apiClient.post('/auth/signup', {
                email: formData.email,
                password: formData.password,
            });

            if (response.data?.userId) {
                navigate('/dashboard'); // ✅ Redirect on success
            } else {
                throw new Error("Unexpected API response.");
            }
        } catch (err) {
            console.error("❌ Signup failed:", err);
            setError(err.response?.data?.message || "❌ Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle OAuth Signup
    const handleSocialSignup = (provider) => {
        window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/${provider}`;
    };

    return (
        <div className="signup-form">
            <h2>Create Your Account</h2>

            {/* ✅ Show Error Message if Exists */}
            {error && <p className="error-message">{error}</p>}

            <form onSubmit={handleSubmit}>
                <label>Email:
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>Password:
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="8"
                        placeholder="At least 8 characters"
                    />
                </label>
                <label>Confirm Password:
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength="8"
                        placeholder="Re-enter your password"
                    />
                </label>

                {/* ✅ Disable button while loading */}
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
