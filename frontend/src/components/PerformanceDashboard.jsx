// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/PerformanceDashboard.jsx

import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import "chart.js/auto";
import "../styles/components/PerformanceDashboard.css";

const MAX_ENTRIES = 20;

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState({
    mse: [],
    mae: [],
    rse: [],
    timestamps: [],
  });
  const wsRef = useRef(null);

  const connectWebSocket = () => {
    const ws = new WebSocket("ws://localhost:8001/ws/performance");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPerformanceData((prev) => ({
          mse: [...prev.mse, data.mse].slice(-MAX_ENTRIES),
          mae: [...prev.mae, data.mae].slice(-MAX_ENTRIES),
          rse: [...prev.rse, data.rse].slice(-MAX_ENTRIES),
          timestamps: [...prev.timestamps, new Date().toLocaleTimeString()].slice(-MAX_ENTRIES),
        }));
      } catch (err) {
        console.error("❌ WebSocket parsing error:", err);
      }
    };

    ws.onerror = (e) => console.error("❌ WebSocket error:", e);
    ws.onclose = () => console.warn("🔌 WebSocket connection closed.");

    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
      <Card>
        <CardContent className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
