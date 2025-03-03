import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card"; // ✅ Corrected import
import "../styles/components/OptimizationApproval.css";

const OptimizationApproval = () => {
    const [optimizations, setOptimizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get("/api/optimizations")
            .then((response) => {
                setOptimizations(response.data);
                setLoading(false);
            })
            .catch((err) => {
                setError("Failed to load optimizations.");
                setLoading(false);
            });
    }, []);

    const handleApproval = async (id) => {
        try {
            await axios.post(`/api/optimizations/${id}/approve`);
            setOptimizations(optimizations.filter((opt) => opt.id !== id));
        } catch (err) {
            setError("Error approving optimization.");
        }
    };

    const handleRejection = async (id) => {
        try {
            await axios.post(`/api/optimizations/${id}/reject`);
            setOptimizations(optimizations.filter((opt) => opt.id !== id));
        } catch (err) {
            setError("Error rejecting optimization.");
        }
    };

    return (
        <div className="optimization-approval-container">
            <h2>Optimization Requests</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {optimizations.length === 0 && !loading && <p>No pending optimizations.</p>}

            {optimizations.map((opt) => (
                <Card key={opt.id} className="optimization-card">
                    <CardContent>
                        <h3>{opt.title}</h3>
                        <p>{opt.description}</p>
                        <div className="action-buttons">
                            <button className="approve" onClick={() => handleApproval(opt.id)}>Approve</button>
                            <button className="reject" onClick={() => handleRejection(opt.id)}>Reject</button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default OptimizationApproval;
