// /Users/patrick/Projects/Teralynk/frontend/src/components/LogPage.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs));
  }, []);

  const downloadLogs = () => {
    window.open("/api/export_logs");
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "All") return true;
    return log.type === filter;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Notifications Log</h1>
      <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-4">
        <SelectItem value="All">All Logs</SelectItem>
        <SelectItem value="AI Optimization">AI Optimizations</SelectItem>
        <SelectItem value="Retraining Trigger">AI Retraining Alerts</SelectItem>
      </Select>

      <Button onClick={downloadLogs} className="mb-4 bg-blue-500 text-white">
        Download Logs as CSV
      </Button>

      <div className="grid gap-4">
        {filteredLogs.length === 0 ? (
          <p>No log entries available.</p>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log._id}>
              <CardContent className="p-4">
                <p className="text-lg">{log.details}</p>
                <p className="text-sm text-gray-500">{log.timestamp}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
