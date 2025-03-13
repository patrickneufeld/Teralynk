import { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";

export default function AdminDashboard() {
  const [optimizations, setOptimizations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Fetch optimizations from backend
  useEffect(() => {
    const fetchOptimizations = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/ai-optimizations", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error || "Failed to fetch optimizations.");
        }

        const data = await res.json();
        setOptimizations(data?.data || []);
      } catch (err) {
        console.error("❌ Fetch Error:", err);
        setError(err.message || "Failed to load optimizations.");
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizations();
  }, []);

  // ✅ Approve optimization
  const approveOptimization = async (id) => {
    try {
      const res = await fetch("/api/admin/ai-optimizations/approve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Approval failed.");
      }

      setOptimizations((prev) => prev.filter((opt) => opt._id !== id));
    } catch (err) {
      console.error("❌ Approval Error:", err);
      setError(err.message || "Failed to approve optimization.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin AI Optimizations</h1>

      {error && (
        <Alert className="mb-4 text-red-600" role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center">
          <Spinner aria-label="Loading optimizations" />
        </div>
      ) : optimizations.length === 0 ? (
        <p className="text-center text-gray-600">
          No pending optimizations at the moment.
        </p>
      ) : (
        <div className="grid gap-4">
          {optimizations.map((opt) => (
            <Card
              key={opt._id}
              className="border border-gray-300 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4">
                <p className="text-lg text-gray-800 mb-2">
                  {opt.suggested_update || "Optimization suggestion"}
                </p>
                <Button
                  onClick={() => approveOptimization(opt._id)}
                  className="bg-green-500 hover:bg-green-600 text-white"
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
