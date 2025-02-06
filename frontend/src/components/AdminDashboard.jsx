// /Users/patrick/Projects/Teralynk/frontend/src/components/AdminDashboard.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function AdminDashboard() {
  const [optimizations, setOptimizations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptimizations = async () => {
      try {
        const res = await fetch("/api/admin/optimizations");
        if (!res.ok) throw new Error("Failed to fetch optimizations.");
        const data = await res.json();
        setOptimizations(data.pending_optimizations);
      } catch (err) {
        setError("Error fetching optimizations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, []);

  const approveOptimization = async (id) => {
    try {
      const res = await fetch("/api/admin/optimizations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimization_id: id }),
      });

      if (!res.ok) throw new Error("Failed to approve optimization.");
      setOptimizations(optimizations.filter((opt) => opt._id !== id));
    } catch (err) {
      setError("Error approving optimization. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin AI Optimizations</h1>

      {error && <Alert className="mb-4 text-red-500">{error}</Alert>}

      {loading ? (
        <p className="text-center text-gray-500">Loading optimizations...</p>
      ) : optimizations.length === 0 ? (
        <p className="text-center text-gray-600">No pending optimizations.</p>
      ) : (
        <div className="grid gap-4">
          {optimizations.map((opt) => (
            <Card key={opt._id}>
              <CardContent className="p-4">
                <p className="text-lg text-gray-800">{opt.suggested_update}</p>
                <Button onClick={() => approveOptimization(opt._id)} className="mt-2 bg-green-500 text-white">
                  Approve & Apply
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
