// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIBenchmark.jsx

import React, { useEffect, useState } from "react";
import "../styles/components/AIBenchmark.css";
import { Card, CardContent } from "./ui/Card";
import { Bar } from "react-chartjs-2";
import Chart from "chart.js/auto";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

const AIBenchmark = () => {
  const [benchmarkData, setBenchmarkData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBenchmarkData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/benchmark");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch benchmark data");
      setBenchmarkData(data.results || []);
    } catch (err) {
      setError(err.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  const getChartData = () => {
    const models = benchmarkData.map((d) => d.model);
    return {
      labels: models,
      datasets: [
        {
          label: "MSE",
          data: benchmarkData.map((d) => d.mse),
          backgroundColor: "#3b82f6",
        },
        {
          label: "MAE",
          data: benchmarkData.map((d) => d.mae),
          backgroundColor: "#10b981",
        },
        {
          label: "RSE",
          data: benchmarkData.map((d) => d.rse),
          backgroundColor: "#f59e0b",
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Error Value" },
      },
    },
  };

  return (
    <div className="ai-benchmark-container">
      <h1 className="title">📊 AI Model Benchmark Comparison</h1>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <Button onClick={fetchBenchmarkData} disabled={loading}>
        {loading ? "Refreshing..." : "🔁 Refresh Benchmark Data"}
      </Button>

      <div className="chart-section">
        {benchmarkData.length > 0 ? (
          <Card className="mt-6">
            <CardContent>
              <Bar data={getChartData()} options={chartOptions} />
            </CardContent>
          </Card>
        ) : (
          !loading && <p className="text-gray-500 text-center mt-6">No benchmark data available.</p>
        )}
      </div>

      <div className="metrics-table mt-6">
        {benchmarkData.map((model, idx) => (
          <Card key={idx}>
            <CardContent>
              <h3 className="model-name">{model.model}</h3>
              <ul className="metric-list">
                <li><strong>MSE:</strong> {model.mse}</li>
                <li><strong>MAE:</strong> {model.mae}</li>
                <li><strong>RSE:</strong> {model.rse}</li>
                <li><strong>Accuracy:</strong> {model.accuracy || "N/A"}</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIBenchmark;
