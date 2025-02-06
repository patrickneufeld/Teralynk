// /Users/patrick/Projects/Teralynk/frontend/src/components/Credentials.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";
import { Select } from "@/components/ui/select";

const Credentials = () => {
    const [credentials, setCredentials] = useState([]);
    const [platform, setPlatform] = useState("");
    const [type, setType] = useState("apiKey");
    const [apiKey, setApiKey] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get("/api/credentials");
            setCredentials(response.data);
        } catch (err) {
            setError("Failed to fetch credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCredential = async () => {
        setError("");
        setSuccess("");
        setLoading(true);

        if (!platform.trim() || (type === "apiKey" && !apiKey.trim()) || (type === "credentials" && (!username.trim() || !password.trim()))) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        const payload = {
            platform,
            type,
            apiKey: type === "apiKey" ? apiKey : undefined,
            username: type === "credentials" ? username : undefined,
            password: type === "credentials" ? password : undefined,
        };

        try {
            const response = await axios.post("/api/credentials", payload);
            setCredentials((prev) => [...prev, response.data]);
            setPlatform("");
            setType("apiKey");
            setApiKey("");
            setUsername("");
            setPassword("");
            setSuccess("Credential saved successfully!");
        } catch (err) {
            setError("Failed to save credential.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCredential = async (id) => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await axios.delete(`/api/credentials/${id}`);
            setCredentials((prev) => prev.filter((cred) => cred._id !== id));
            setSuccess("Credential deleted successfully!");
        } catch (err) {
            setError("Failed to delete credential.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Manage Credentials</h2>

            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}
            {success && <Alert className="mb-4 text-green-500">{success}</Alert>}
            {loading && <Loader className="mb-4" />}

            <Card className="mb-4">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Add New Credential</h3>
                    <Input
                        type="text"
                        placeholder="Platform (e.g., OpenAI)"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="mt-2 w-full"
                    />

                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="mt-2 w-full"
                    >
                        <option value="apiKey">API Key</option>
                        <option value="credentials">Username/Password</option>
                    </Select>

                    {type === "apiKey" && (
                        <Input
                            type="text"
                            placeholder="API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="mt-2 w-full"
                        />
                    )}

                    {type === "credentials" && (
                        <>
                            <Input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-2 w-full"
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 w-full"
                            />
                        </>
                    )}

                    <Button
                        onClick={handleSaveCredential}
                        disabled={loading}
                        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        {loading ? "Saving..." : "Save Credential"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Saved Credentials</h3>
                    {credentials.length === 0 ? (
                        <p className="text-gray-600">No credentials saved yet.</p>
                    ) : (
                        <ul className="grid gap-2">
                            {credentials.map((cred) => (
                                <li key={cred._id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                                    <strong>{cred.platform}</strong> ({cred.type})
                                    <Button
                                        onClick={() => handleDeleteCredential(cred._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Delete
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Credentials;
