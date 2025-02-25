// /Users/patrick/Projects/Teralynk/frontend/src/components/PerformanceDashboard.jsx

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "chart.js/auto";

export default function PerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState({
    mse: [],
    mae: [],
    rse: [],
    timestamps: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ws;

    const connectWebSocket = () => {
      ws = new WebSocket("ws://localhost:8001/ws/performance");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setPerformanceData((prev) => ({
            mse: [...prev.mse, data.mse].slice(-20),
            mae: [...prev.mae, data.mae].slice(-20),
            rse: [...prev.rse, data.rse].slice(-20),
            timestamps: [...prev.timestamps, data.timestamp].slice(-20),
          }));
          setLoading(false);
        } catch (err) {
          console.error("WebSocket message parsing error:", err);
          setError("Failed to process real-time data.");
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket connection failed.");
      };

      ws.onclose = () => {
        console.warn("WebSocket closed. Reconnecting...");
        setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();
    return () => ws && ws.close();
  }, []);

  const retryFetch = () => {
    setPerformanceData({ mse: [], mae: [], rse: [], timestamps: [] });
    setError(null);
    setLoading(true);
  };

  const chartData = {
    labels: performanceData.timestamps,
    datasets: [
      {
        label: "MSE",
        data: performanceData.mse,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.3,
      },
      {
        label: "MAE",
        data: performanceData.mae,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.3,
      },
      {
        label: "RSE",
        data: performanceData.rse,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Performance Dashboard</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-600 rounded">
          <p>{error}</p>
          <Button onClick={retryFetch} className="mt-2 bg-red-500 hover:bg-red-600 text-white">
            Retry Connection
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500">Loading performance metrics...</p>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
