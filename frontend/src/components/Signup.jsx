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

    // ✅ Input Handler: Optimized to reduce re-renders
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "password" || name === "confirmPassword") {
            validatePassword(formData.password, formData.confirmPassword);
        }
    };

    // ✅ Password Validation: Improved with detailed feedback
    const validatePassword = (password, confirmPassword) => {
        const issues = [];
        if (password.length < 8) issues.push("at least 8 characters");
        if (!/[A-Z]/.test(password)) issues.push("an uppercase letter");
        if (!/[a-z]/.test(password)) issues.push("a lowercase letter");
        if (!/[0-9]/.test(password)) issues.push("a number");
        if (!/[!@#$%^&*]/.test(password)) issues.push("a special character (!@#$%^&*)");
        if (password !== confirmPassword) issues.push("Passwords must match");

        setPasswordError(issues.length ? `Password must include: ${issues.join(", ")}` : '');
        return issues.length === 0;
    };

    // ✅ Full Form Validation
    const isFormValid = () => {
        const { username, email, password, confirmPassword } = formData;
        return (
            username.trim() &&
            email.trim() &&
            validatePassword(password, confirmPassword)
        );
    };

    // ✅ Signup Logic
    const handleSignup = async () => {
        if (!isFormValid()) return;

        setLoading(true);
        setError('');

        try {
            await apiClient.post('/auth/signup', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
            });
            setIsConfirmed(true);
        } catch (err) {
            console.error("❌ Signup failed:", err);
            setError(err.response?.data?.message || "Unexpected error during signup.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Confirmation Logic
    const handleConfirmSignup = async () => {
        if (!formData.confirmationCode.trim()) {
            setError("Please provide the confirmation code.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/auth/confirm-signup', {
                username: formData.username,
                confirmationCode: formData.confirmationCode,
            });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err) {
            console.error("❌ Confirmation failed:", err);
            setError(err.response?.data?.message || "Invalid confirmation code.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Component JSX
    return (
        <div className="signup-container">
            <h2>{isConfirmed ? "Confirm Signup" : "Signup"}</h2>
            {error && <p className="error" aria-live="polite">{error}</p>}
            {!isConfirmed ? (
                <form>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        aria-label="Enter your username"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        aria-label="Enter your email"
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        aria-label="Enter a secure password"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        aria-label="Re-enter your password to confirm"
                    />
                    {passwordError && <p className="error">{passwordError}</p>}
                    <button
                        onClick={handleSignup}
                        disabled={loading || !isFormValid()}
                        aria-busy={loading}
                    >
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>
            ) : (
                <form>
                    <input
                        type="text"
                        name="confirmationCode"
                        placeholder="Confirmation Code"
                        value={formData.confirmationCode}
                        onChange={handleChange}
                        required
                        aria-label="Enter the confirmation code you received"
                    />
                    <button
                        onClick={handleConfirmSignup}
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? "Confirming..." : "Confirm Signup"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default Signup;
