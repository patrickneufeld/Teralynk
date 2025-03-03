// /Users/patrick/Projects/Teralynk/frontend/src/components/FileManager.jsx

import React, { useState, useCallback } from "react";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "@/components/ui/Backutton";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Loader } from "@/components/ui/Loader";

const FileManager = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post("/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFiles((prevFiles) => [...prevFiles, response.data]);
            setSuccess("File uploaded successfully!");
        } catch (err) {
            setError("Failed to upload file. Please try again.");
            console.error("File upload error:", err);
        } finally {
            setUploading(false);
        }
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">File Manager</h2>

            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}
            {success && <Alert className="mb-4 text-green-500">{success}</Alert>}
            {uploading && <Loader className="mb-4" />}

            <Card className="mb-4">
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Upload a File</h3>
                    <Input
                        type="file"
                        onChange={handleFileUpload}
                        aria-label="Upload a file"
                        disabled={uploading}
                        className="mt-2 w-full"
                    />
                    <Button
                        disabled={uploading}
                        className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">Uploaded Files</h3>
                    {files.length === 0 ? (
                        <p className="text-gray-600">No files uploaded yet.</p>
                    ) : (
                        <ul className="grid gap-2">
                            {files.map((file) => (
                                <li key={file.id} className="text-gray-700 bg-gray-100 p-3 rounded-md">
                                    {file.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FileManager;
