// /Users/patrick/Projects/Teralynk/frontend/src/components/Notifications.jsx

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import "../styles/components/Notifications.css";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState("All");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/notifications");
                if (!response.ok) throw new Error("Failed to load notifications.");
                const data = await response.json();
                setNotifications(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // WebSocket for real-time updates
        const ws = new WebSocket("ws://localhost:8001/ws/notifications");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications(data.notifications);
        };

        return () => ws.close();
    }, []);

    const handleApproval = async (id, status) => {
        try {
            await fetch("/api/admin/optimizations/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ optimization_id: id, status }),
            });

            setNotifications((prev) => prev.filter((notif) => notif._id !== id));
        } catch (err) {
            setError("Failed to update notification status.");
        }
    };

    const filteredNotifications = notifications.filter((notif) => {
        if (filter === "All") return true;
        return notif.type === filter;
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">AI Notifications</h1>

            {error && <p className="error-message">{error}</p>}
            {loading && <p className="loading-message">Loading notifications...</p>}

            <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4">
                <SelectItem value="All">All Notifications</SelectItem>
                <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
                <SelectItem value="Retraining Trigger">AI Retraining Alerts</SelectItem>
            </Select>

            <div className="grid gap-4">
                {filteredNotifications.length === 0 && !loading ? (
                    <p>No notifications available.</p>
                ) : (
                    filteredNotifications.map((notif) => (
                        <Card key={notif._id}>
                            <CardContent className="p-4">
                                <p className="text-lg">{notif.update_details || notif.message}</p>
                                <span className="timestamp">
                                    {new Date(notif.timestamp || notif.date).toLocaleString()}
                                </span>

                                {notif.status === "Pending Approval" && (
                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            onClick={() => handleApproval(notif._id, "Approved")}
                                            className="bg-green-500 text-white"
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleApproval(notif._id, "Rejected")}
                                            className="bg-red-500 text-white"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
