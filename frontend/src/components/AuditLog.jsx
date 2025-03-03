// /Users/patrick/Projects/Teralynk/frontend/src/components/AuditLog.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "../components/ui/Card";
import '../styles/components/AuditLog.css';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuditLogs = async () => {
            try {
                const response = await axios.get('/api/audit/logs');
                setLogs(response.data);
            } catch (err) {
                setError('Error loading audit logs.');
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, []);

    return (
        <div className="audit-log">
            <h2>Audit Log</h2>
            {loading ? <p>Loading logs...</p> : error ? <p>{error}</p> : (
                <div className="logs-container">
                    {logs.length === 0 ? <p>No audit logs found.</p> : logs.map((log, index) => (
                        <Card key={index}>
                            <CardContent>
                                <p><strong>User:</strong> {log.user}</p>
                                <p><strong>Action:</strong> {log.action}</p>
                                <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditLog;
