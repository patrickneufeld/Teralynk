// ✅ FILE PATH: frontend/src/components/AdminReview.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Loader } from "../components/ui/loader";

const AdminReview = () => {
  const [pendingPlatforms, setPendingPlatforms] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch Pending Platform Requests
  useEffect(() => {
    const fetchPendingPlatforms = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await axios.get("/api/admin-review/pending", {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ Include authentication token
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        setPendingPlatforms(response.data);
      } catch (error) {
        console.error("❌ Error fetching pending platforms:", error);
        setErrorMessage("Error fetching pending platforms.");
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPlatforms();
  }, []);

  // ✅ Handle Approve/Reject Actions
  const handleAction = async (userId, platform, action) => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await axios.post(
        `/api/admin-review/${action}`,
        { userId, platform },
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`, // ✅ Include authentication token
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      // ✅ Remove approved/rejected platform from the list
      setPendingPlatforms((prev) =>
        prev.filter((user) => user._id !== userId || !user[platform]?.adminReviewPending)
      );

      setSuccessMessage(`Platform "${platform}" ${action}ed successfully.`);
    } catch (error) {
      console.error(`❌ Error ${action}ing platform:`, error);
      setErrorMessage(`Error ${action}ing platform.`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter platforms based on search term
  const filteredPlatforms = pendingPlatforms.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Admin Review</h2>

      {loading && <Loader className="mb-4" />}
      {errorMessage && <Alert className="mb-4 text-red-500">{errorMessage}</Alert>}
      {successMessage && <Alert className="mb-4 text-green-500">{successMessage}</Alert>}

      {/* ✅ Search Functionality */}
      <Input
        type="text"
        placeholder="Search by email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full p-2 border border-gray-300 rounded-md"
        aria-label="Search users by email"
      />

      {/* ✅ Display Pending Platforms */}
      {filteredPlatforms.length === 0 && !loading ? (
        <p className="text-center text-gray-600">No platforms pending approval.</p>
      ) : (
        <ul className="grid gap-4">
          {filteredPlatforms.map((user) => (
            <Card key={user._id} className="border border-gray-300 shadow-md">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">{user.email}</h3>
                <ul className="mt-2 space-y-2">
                  {Object.entries(user)
                    .filter(([key, value]) => key !== "_id" && key !== "email" && typeof value === "object" && value?.adminReviewPending)
                    .map(([platform]) => (
                      <li key={platform} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                        <span className="font-medium">{platform}</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAction(user._id, platform, "approve")}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            aria-label={`Approve ${platform} for ${user.email}`}
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleAction(user._id, platform, "reject")}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            aria-label={`Reject ${platform} for ${user.email}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminReview;
