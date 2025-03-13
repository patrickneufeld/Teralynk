// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/LogPage.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Select, SelectItem } from "../components/ui/Select";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { Loader } from "../components/ui/Loader";
import { logError, getErrorMessage } from "../utils/ErrorHandler";
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
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load logs.");
        }

        setLogs(data.logs || []);
      } catch (err) {
        logError(err, "LogPage - fetchLogs");
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const downloadLogs = async () => {
    try {
      window.open("/api/export_logs", "_blank");
    } catch (err) {
      logError(err, "LogPage - downloadLogs");
      alert("⚠️ Failed to download logs.");
    }
  };

  const filteredLogs = logs.filter((log) =>
    filter === "All" ? true : log.type === filter
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">📄 AI Notifications Log</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full md:w-1/3">
          <SelectItem value="All">All Logs</SelectItem>
          <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
          <SelectItem value="Retraining Trigger">AI Retraining Alerts</SelectItem>
        </Select>

        <Button
          onClick={downloadLogs}
          className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
        >
          <FaDownload className="mr-2" />
          Download Logs as CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center my-6">
          <Loader />
        </div>
      ) : error ? (
        <Alert type="error" className="text-center">{error}</Alert>
      ) : filteredLogs.length === 0 ? (
        <p className="text-center text-gray-500">No log entries available.</p>
      ) : (
        <div className="grid gap-4">
          {filteredLogs.map((log) => (
            <Card key={log._id} className="bg-gray-50 border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-lg font-medium">{log.details}</p>
                <p className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
