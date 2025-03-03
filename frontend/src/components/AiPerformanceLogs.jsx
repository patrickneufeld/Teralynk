// /Users/patrick/Projects/Teralynk/frontend/src/components/AiPerformanceLogs.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/ui/Card";
import '../styles/AiPerformanceLogs.css';

const AiPerformanceLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get('/api/ai/logs');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to fetch AI performance logs.');
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="ai-performance-logs">
            <h2>AI Performance Logs</h2>
            {loading ? <p>Loading logs...</p> : error ? <p>{error}</p> : (
                <div className="logs-container">
                    {logs.length === 0 ? <p>No logs available.</p> : logs.map((log, index) => (
                        <Card key={index}>
                            <CardContent>
                                <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                                <p><strong>Message:</strong> {log.message}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AiPerformanceLogs;
