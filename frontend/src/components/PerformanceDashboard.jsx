// ✅ File Path: /Users/patrick/Projects/Teralynk/frontend/src/components/PerformanceDashboard.jsx

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import "chart.js/auto";
import "../styles/components/PerformanceDashboard.css";

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState({
    mse: [],
    mae: [],
    rse: [],
    timestamps: [],
  });

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8001/ws/performance");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setPerformanceData((prevData) => ({
          mse: [...prevData.mse, data.mse].slice(-20),
          mae: [...prevData.mae, data.mae].slice(-20),
          rse: [...prevData.rse, data.rse].slice(-20),
          timestamps: [...prevData.timestamps, new Date().toLocaleTimeString()].slice(-20),
        }));
      } catch (error) {
        console.error("❌ Error parsing WebSocket data:", error);
      }
    };

    return () => ws.close();
  }, []);

  const chartData = {
    labels: performanceData.timestamps,
    datasets: [
      { label: "MSE", data: performanceData.mse, borderColor: "rgba(75, 192, 192, 1)", fill: false },
      { label: "MAE", data: performanceData.mae, borderColor: "rgba(255, 99, 132, 1)", fill: false },
      { label: "RSE", data: performanceData.rse, borderColor: "rgba(54, 162, 235, 1)", fill: false },
    ],
  };

  return (
    <div className="performance-dashboard">
      <h1>AI Performance Dashboard</h1>
      <Card>
        <CardContent className="chart-container">
          <Line data={chartData} />
        </CardContent>
      </Card>
      <Button>Refresh Data</Button>
    </div>
  );
}
