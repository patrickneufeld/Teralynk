// /Users/patrick/Projects/Teralynk/frontend/src/components/LogPage.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/Select";
import Button from "../components/ui/Button";
import { FaDownload } from "react-icons/fa";

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/logs");
        if (!response.ok) throw new Error("Failed to fetch logs.");
        const data = await response.json();
        setLogs(data.logs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const downloadLogs = () => {
    window.open("/api/export_logs");
  };

  const filteredLogs = logs.filter((log) => (filter === "All" ? true : log.type === filter));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">AI Notifications Log</h1>

      {/* Filter Dropdown */}
      <div className="mb-4 flex justify-center">
        <Select onValueChange={setFilter} value={filter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter Logs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Logs</SelectItem>
            <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
            <SelectItem value="Retraining Trigger">AI Retraining Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Download Button */}
      <div className="flex justify-center mb-6">
        <Button onClick={downloadLogs} className="bg-blue-500 hover:bg-blue-600 text-white flex items-center">
          <FaDownload className="mr-2" /> Download Logs as CSV
        </Button>
      </div>

      {/* Error Handling */}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Loading State */}
      {loading ? (
        <p className="text-center text-gray-500">Loading logs...</p>
      ) : (
        <div className="grid gap-4">
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500">No log entries available.</p>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log._id} className="bg-gray-100 shadow">
                <CardContent className="p-4">
                  <p className="text-lg font-medium">{log.details}</p>
                  <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
