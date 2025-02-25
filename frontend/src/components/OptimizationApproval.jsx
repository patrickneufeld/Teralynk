// /Users/patrick/Projects/Teralynk/frontend/src/components/OptimizationApproval.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import '../styles/components/OptimizationApproval.css';

const OptimizationApproval = () => {
    const [optimizations, setOptimizations] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOptimizations = async () => {
            try {
                const response = await axios.get('/api/admin/optimizations');
                setOptimizations(response.data);
            } catch (err) {
                setError('Failed to load optimization requests.');
            } finally {
                setLoading(false);
            }
        };

        fetchOptimizations();
    }, []);

    const handleApproval = async (id, status) => {
        try {
            await axios.post('/api/admin/optimizations/approve', { optimization_id: id, status });
            setOptimizations((prev) => prev.filter((opt) => opt._id !== id));
        } catch (err) {
            setError('Failed to update optimization status.');
        }
    };

    return (
        <div className="optimization-approval">
            <h2>Pending AI Optimizations</h2>
            {loading ? <p>Loading...</p> : error ? <p>{error}</p> : (
                <div className="optimizations-container">
                    {optimizations.length === 0 ? <p>No pending optimizations.</p> : optimizations.map((opt) => (
                        <Card key={opt._id}>
                            <CardContent>
                                <p><strong>Details:</strong> {opt.details}</p>
                                <div className="approval-buttons">
                                    <button onClick={() => handleApproval(opt._id, "Approved")} className="approve-btn">
                                        Approve
                                    </button>
                                    <button onClick={() => handleApproval(opt._id, "Rejected")} className="reject-btn">
                                        Reject
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OptimizationApproval;
