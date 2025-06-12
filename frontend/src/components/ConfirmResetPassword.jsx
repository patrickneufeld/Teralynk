// File: /frontend/src/components/ConfirmResetPassword.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import { confirmPasswordReset } from "../services/aws/password"; // ✅ ADD ACTUAL FUNCTION

const ConfirmResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Actual reset password confirmation
      await confirmPasswordReset(
        formData.email,
        formData.code,
        formData.newPassword
      );

      toast.success("Password reset successful. Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Reset confirmation error:", err);
      setError(err.message || "Failed to reset password.");
      toast.error(err.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-reset-container">
      <h2>Confirm Password Reset</h2>

      {error && <Alert message={error} type="error" />}

      <form onSubmit={handleSubmit} className="confirm-reset-form">
        <Input
          type="email"
          name="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          disabled={!!location.state?.email}
          required
        />

        <Input
          type="text"
          name="code"
          label="Confirmation Code"
          value={formData.code}
          onChange={handleChange}
          required
        />

        <Input
          type="password"
          name="newPassword"
          label="New Password"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />

        <Input
          type="password"
          name="confirmPassword"
          label="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>

        {/* ✅ Helpful exit for users */}
        <p className="text-sm text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ConfirmResetPassword;
