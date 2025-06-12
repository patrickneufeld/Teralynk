// ✅ FILE PATH: frontend/src/components/AddStorage.jsx

import React, { useState } from "react";
import axios from "axios";

const AddStorage = () => {
    const [platform, setPlatform] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const platforms = [
        { id: "onedrive", name: "OneDrive" },
        { id: "dropbox", name: "Dropbox" },
        { id: "googleDrive", name: "Google Drive" },
        { id: "mega", name: "Mega" },
        { id: "pCloud", name: "pCloud" },
        { id: "icloud", name: "iCloud" },
    ];

    const handleAddStorage = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!platform) {
            setError("Please select a storage platform.");
            setLoading(false);
            return;
        }

        try {
            // ✅ Request OAuth URL from backend
            const response = await axios.get(`/api/storage/auth-url?platform=${platform}`);
            const authUrl = response.data.authUrl;

            if (authUrl) {
                window.location.href = authUrl; // Redirect to OAuth authorization
            } else {
                throw new Error("Failed to retrieve OAuth URL.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error initializing authentication. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Add Storage Platform</h2>
            <form onSubmit={handleAddStorage} className="space-y-4">
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
                    Select Platform:
                    <select
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        aria-label="Select a storage platform"
                    >
                        <option value="">-- Choose a platform --</option>
                        {platforms.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md"
                    aria-label="Authenticate storage platform"
                >
                    {loading ? "Connecting..." : "Connect Platform"}
                </button>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
        </div>
    );
};

export default AddStorage;
