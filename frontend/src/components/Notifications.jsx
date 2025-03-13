// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/Notifications.jsx

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select, { SelectItem } from "../components/ui/Select";
import "../styles/components/Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const ws = new WebSocket("ws://localhost:8001/ws/notifications");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data.notifications)) {
          setNotifications((prev) => [...data.notifications, ...prev]);
        }
      } catch (err) {
        console.error("❌ WebSocket message error:", err);
      }
    };

    return () => ws.close();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load notifications.");

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      const response = await fetch("/api/admin/optimizations/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ optimization_id: id, status }),
      });

      if (!response.ok) throw new Error("Failed to update notification status.");

      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (err) {
      setError(err.message || "Failed to update notification.");
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "All") return true;
    return notif.type === filter;
  });

  return (
    <div className="notifications-container">
      <h1 className="notifications-title">🔔 AI Notifications</h1>

      {error && <p className="error-message" role="alert">❌ {error}</p>}
      {loading && <p className="loading-message">⏳ Loading notifications...</p>}

      <Select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="filter-select"
        aria-label="Filter Notifications"
      >
        <SelectItem value="All">All Notifications</SelectItem>
        <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
        <SelectItem value="Retraining Trigger">AI Retraining Alerts</SelectItem>
      </Select>

      <div className="notifications-grid">
        {filteredNotifications.length === 0 && !loading ? (
          <p className="empty-message">📭 No notifications found.</p>
        ) : (
          filteredNotifications.map((notif) => (
            <Card key={notif._id} className="notification-card">
              <CardContent>
                <p className="notification-text">
                  {notif.update_details || notif.message}
                </p>
                <span className="notification-timestamp">
                  {new Date(notif.timestamp || notif.date).toLocaleString()}
                </span>

                {notif.status === "Pending Approval" && (
                  <div className="actions">
                    <Button
                      onClick={() => handleApproval(notif._id, "Approved")}
                      className="approve-button"
                    >
                      ✅ Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(notif._id, "Rejected")}
                      className="reject-button"
                    >
                      ❌ Reject
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
};

export default Notifications;
