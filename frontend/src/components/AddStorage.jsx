// /Users/patrick/Projects/Teralynk/frontend/src/components/AddStorage.jsx

import React, { useState } from "react";
import axios from "axios";

const AddStorage = () => {
    const [platform, setPlatform] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAddStorage = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        if (!platform || !username || !password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("/api/storage/add", {
                platform,
                username,
                password,
            });
            setSuccess("Storage platform added successfully!");
            console.log(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Error adding storage platform. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white shadow-lg rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Add New Storage Platform</h2>
            <form onSubmit={handleAddStorage} className="space-y-4">
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
                    Platform:
                    <select
                        id="platform"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        aria-label="Select a storage platform"
                    >
                        <option value="">Select a platform</option>
                        <option value="onedrive">OneDrive</option>
                        <option value="dropbox">Dropbox</option>
                        <option value="googleDrive">Google Drive</option>
                        <option value="mega">Mega</option>
                        <option value="pCloud">pCloud</option>
                        <option value="icloud">iCloud</option>
                    </select>
                </label>

                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username:
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        aria-label="Enter your username"
                    />
                </label>

                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password:
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        aria-label="Enter your password"
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-md"
                    aria-label="Add storage platform"
                >
                    {loading ? "Adding..." : "Add Platform"}
                </button>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
            </form>
        </div>
    );
};

export default AddStorage;
