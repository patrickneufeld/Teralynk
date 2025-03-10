import React, { useState } from 'react';
import PropTypes from 'prop-types';

const LoginComponent = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Error state for user feedback
  const [loading, setLoading] = useState(false); // Loading state for button disable

  const handleLogin = async () => {
    // Reset error state and enable loading
    setError(null);
    setLoading(true);

    try {
      if (!username || !password) {
        throw new Error('Both username and password are required.');
      }

      // Mock API call - Replace this with real backend API call
      const response = await fakeApiLogin(username, password);

      if (response.AuthenticationResult) {
        onLogin(response.AuthenticationResult);
      } else {
        throw new Error(response.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message); // Display error to user
      console.error('Login error:', err);
    } finally {
      setLoading(false); // Disable loading state after operation
    }
  };

  // Mock API function - Replace with actual API request
  const fakeApiLogin = async (username, password) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        if (username === 'admin' && password === 'password') {
          resolve({ AuthenticationResult: 'SampleAuthToken' });
        } else {
          resolve({ error: 'Invalid username or password.' });
        }
      }, 1000)
    );
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      {/* Username Input */}
      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      {/* Password Input */}
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* Error Message */}
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Login Button */}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
};

// Validate the `onLogin` prop
LoginComponent.propTypes = {
  onLogin: PropTypes.func.isRequired,
};

export default LoginComponent;
