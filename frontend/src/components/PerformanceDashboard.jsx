import React, { useEffect, useState } from "react";
import { createWebSocket } from "../utils/websocketClient";
import { Line } from "react-chartjs-2";
import { Card, CardContent } from "../components/ui/Card";
import "chart.js/auto";
import "../styles/components/PerformanceDashboard.css";
import WebSocketHealthBanner from "../components/common/WebSocketHealthBanner"; // New component for WebSocket status

const MAX_ENTRIES = 20;

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState({
    mse: [],
    mae: [],
    rse: [],
    timestamps: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = createWebSocket("/ws/performance", {
      onMessage: (data) => {
        if (!data) return;
        setPerformanceData((prev) => ({
          mse: [...prev.mse, data.mse ?? 0].slice(-MAX_ENTRIES),
          mae: [...prev.mae, data.mae ?? 0].slice(-MAX_ENTRIES),
          rse: [...prev.rse, data.rse ?? 0].slice(-MAX_ENTRIES),
          timestamps: [...prev.timestamps, new Date().toLocaleTimeString()].slice(-MAX_ENTRIES),
        }));
        setLoading(false); // Set loading to false after receiving data
      },
      onError: (err) => {
        console.error("❌ Performance WebSocket error:", err);
        setError("Failed to fetch performance data");
        setLoading(false);
      },
      onClose: () => {
        console.warn("🟡 Performance WebSocket disconnected.");
        setError("WebSocket disconnected. Attempting to reconnect...");
        setLoading(false);
      },
    });

    // Cleanup WebSocket on component unmount
    return () => socket.close();
  }, []);

  // Chart data preparation
  const chartData = {
    labels: performanceData.timestamps,
    datasets: [
      {
        label: "MSE",
        data: performanceData.mse,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "MAE",
        data: performanceData.mae,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "RSE",
        data: performanceData.rse,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
        fill: false,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Error Value",
        },
      },
      x: {
        title: {
          display: true,
          text: "Timestamp",
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <div className="performance-dashboard">
      <h1 className="text-2xl font-bold mb-4">📈 AI Performance Dashboard</h1>

      {/* WebSocket health banner to show connection status */}
      <WebSocketHealthBanner />

      {loading && <p className="text-center">Loading performance data...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Display the performance chart */}
      <Card>
        <CardContent className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
