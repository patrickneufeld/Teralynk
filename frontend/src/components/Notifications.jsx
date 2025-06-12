import React, { useEffect, useState, useCallback } from "react";
import { createWebSocket } from "../utils/websocketClient";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select, { SelectItem } from "../components/ui/Select";
import "../styles/components/Notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);  // Manage WebSocket instance

  // Function to fetch notifications from the backend
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load notifications.");

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("❌ fetchNotifications error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection handling
  useEffect(() => {
    const socketInstance = createWebSocket("/ws/notifications", {
      onMessage: (data) => {
        if (Array.isArray(data.notifications)) {
          setNotifications((prev) => [...data.notifications, ...prev]);
        }
      },
      onError: (err) => {
        console.error("❌ Notifications WebSocket error:", err);
        setError("WebSocket error occurred.");
      },
      onClose: () => {
        console.warn("🟡 Notifications WebSocket disconnected.");
        setError("WebSocket connection lost.");
      },
    });

    setSocket(socketInstance);

    // Fetch initial notifications on mount
    fetchNotifications();

    // Cleanup WebSocket connection on unmount
    return () => socketInstance.close();
  }, [fetchNotifications]);

  // Approve or reject a notification
  const handleApproval = async (id, status) => {
    try {
      await fetch("/api/admin/optimizations/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ optimization_id: id, status }),
      });
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (err) {
      console.error("❌ handleApproval error:", err);
      setError(err.message || "Failed to update notification.");
    }
  };

  const filteredNotifications = notifications.filter((notif) =>
    filter === "All" ? true : notif.type === filter
  );

  return (
    <div className="notifications-container">
      <h1 className="notifications-title">🔔 AI Notifications</h1>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Loading notifications...</p>}

      {/* Filter options */}
      <Select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="filter-select"
      >
        <SelectItem value="All">All Notifications</SelectItem>
        <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
        <SelectItem value="Retraining Trigger">Retraining Alerts</SelectItem>
      </Select>

      <div className="notifications-grid">
        {filteredNotifications.length === 0 && !loading ? (
          <p>No notifications found.</p>
        ) : (
          filteredNotifications.map((notif) => (
            <Card key={notif._id} className="notification-card">
              <CardContent>
                <p>{notif.update_details || notif.message}</p>
                <span>{new Date(notif.timestamp || notif.date).toLocaleString()}</span>

                {notif.status === "Pending Approval" && (
                  <div className="actions">
                    <Button onClick={() => handleApproval(notif._id, "Approved")}>
                      Approve
                    </Button>
                    <Button onClick={() => handleApproval(notif._id, "Rejected")}>
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Handle WebSocket disconnection */}
      {socket && socket.readyState !== WebSocket.OPEN && (
        <div className="reconnect-banner">
          <p>WebSocket disconnected. Trying to reconnect...</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
