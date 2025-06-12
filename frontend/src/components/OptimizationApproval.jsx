// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/OptimizationApproval.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import "../styles/components/OptimizationApproval.css";

const OptimizationApproval = () => {
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOptimizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/optimizations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
      });
      setOptimizations(response.data);
    } catch (err) {
      console.error("❌ Failed to load optimizations:", err);
      setError("Failed to load optimizations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimizations();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.post(
        `/api/optimizations/${id}/${status}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );
      setOptimizations((prev) => prev.filter((opt) => opt.id !== id));
    } catch (err) {
      console.error(`❌ Error updating optimization ${status}:`, err);
      setError(`Error ${status === "approve" ? "approving" : "rejecting"} optimization.`);
    }
  };

  if (loading) return <p className="loading-message">Loading optimizations...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="optimization-approval-container">
      <h2 className="text-2xl font-bold mb-4">🧠 Pending AI Optimizations</h2>

      {optimizations.length === 0 ? (
        <p className="empty-message">✅ No pending optimizations.</p>
      ) : (
        optimizations.map((opt) => (
          <Card key={opt.id} className="optimization-card">
            <CardContent>
              <h3 className="text-lg font-semibold">{opt.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{opt.description}</p>
              <div className="flex gap-4">
                <Button
                  className="bg-green-500 text-white"
                  onClick={() => updateStatus(opt.id, "approve")}
                >
                  ✅ Approve
                </Button>
                <Button
                  className="bg-red-500 text-white"
                  onClick={() => updateStatus(opt.id, "reject")}
                >
                  ❌ Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default OptimizationApproval;
