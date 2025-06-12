// ✅ FILE PATH: /Users/patrick/Projects/Teralynk/frontend/src/components/NotificationLog.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card"; // ✅ Correct import
import "../styles/components/NotificationLog.css";

const NotificationLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get("/api/notifications/logs");
                setLogs(response.data);
            } catch (err) {
                console.error("❌ Error fetching notification logs:", err);
                setError("Failed to load notifications log.");
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="notification-log p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Notification Log</h2>

            {loading ? (
                <p className="text-center text-gray-500">Loading notifications...</p>
            ) : error ? (
                <p className="text-red-500 text-center">{error}</p>
            ) : logs.length === 0 ? (
                <p className="text-center text-gray-600">No notifications available.</p>
            ) : (
                <div className="grid gap-4">
                    {logs.map((log) => (
                        <Card key={log._id} className="border border-gray-300 shadow-md">
                            <CardContent className="p-4">
                                <p className="text-lg font-semibold">{log.type}</p>
                                <p className="text-gray-800">{log.message}</p>
                                <span className="timestamp text-gray-500 text-sm">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationLog;
