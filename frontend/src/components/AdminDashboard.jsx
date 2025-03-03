// ✅ FILE PATH: /Users/patrick/Projects/Teralynk/frontend/src/components/AdminDashboard.jsx

import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner"; // Assuming you have a Spinner component for loading indication

export default function AdminDashboard() {
  const [optimizations, setOptimizations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch pending AI optimizations
  useEffect(() => {
    const fetchOptimizations = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/optimizations", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ Include auth token
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch optimizations.");
        const data = await res.json();
        setOptimizations(data.pending_optimizations);
      } catch (err) {
        console.error("❌ Error fetching optimizations:", err);
        setError("Error fetching optimizations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, []);

  // ✅ Approve an AI optimization
  const approveOptimization = async (id) => {
    try {
      const res = await fetch("/api/admin/optimizations/approve", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ Include auth token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optimization_id: id }),
      });

      if (!res.ok) throw new Error("Failed to approve optimization.");
      
      // ✅ Remove the approved optimization from the list
      setOptimizations((prev) => prev.filter((opt) => opt._id !== id));
    } catch (err) {
      console.error("❌ Error approving optimization:", err);
      setError("Error approving optimization. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin AI Optimizations</h1>

      {error && <Alert className="mb-4 text-red-500">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center items-center">
          <Spinner /> {/* Loading spinner component */}
        </div>
      ) : optimizations.length === 0 ? (
        <p className="text-center text-gray-600">No pending optimizations.</p>
      ) : (
        <div className="grid gap-4">
          {optimizations.map((opt) => (
            <Card key={opt._id} className="border border-gray-300 shadow-md">
              <CardContent className="p-4">
                <p className="text-lg text-gray-800">{opt.suggested_update}</p>
                <Button
                  onClick={() => approveOptimization(opt._id)}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white"
                  aria-label="Approve optimization"
                >
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
