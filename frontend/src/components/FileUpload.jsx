// /Users/patrick/Projects/Teralynk/frontend/src/components/FileUpload.jsx

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader } from "@/components/ui/loader";

const FileUpload = () => {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [storageInfo, setStorageInfo] = useState(null);

    const getBestStorageOption = useCallback(async (file) => {
        try {
            const response = await axios.post("/api/storage/check", {
                fileSize: file.size,
            });
            setStorageInfo(response.data);

            if (response.data.suggestUpgrade) {
                setError("Your storage is almost full. Consider upgrading your plan!");
            }
        } catch (error) {
            console.error("Error determining best storage option:", error);
            setError("Error determining storage. Please try again later.");
        }
    }, []);

    const onDrop = useCallback(
        async (acceptedFiles) => {
            setUploading(true);
            setError("");
            setSuccess("");

            try {
                await Promise.all(acceptedFiles.map(getBestStorageOption));

                if (error) return;

                const formData = new FormData();
                acceptedFiles.forEach((file) => {
                    formData.append("files", file);
                });

                const response = await axios.post("/api/files/upload", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                setUploadedFiles(response.data.files);
                setSuccess("Files uploaded successfully!");
            } catch (error) {
                setError("Error uploading files. Please try again.");
            } finally {
                setUploading(false);
            }
        },
        [getBestStorageOption, error]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: true,
        accept: "image/*,video/*,application/pdf",
    });

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">File Upload</h2>

            {error && <Alert className="mb-4 text-red-500">{error}</Alert>}
            {success && <Alert className="mb-4 text-green-500">{success}</Alert>}
            {uploading && <Loader className="mb-4" />}

            <Card className="mb-4">
                <CardContent className="p-4 text-center border-dashed border-2 border-gray-300 rounded-lg">
                    <div
                        {...getRootProps()}
                        className="p-6 cursor-pointer hover:bg-gray-100 transition"
                        aria-label="Drop files here or click to select files"
                    >
                        <input {...getInputProps()} />
                        <p className="text-gray-600">Drag & Drop your files here, or click to select files</p>
                    </div>
                </CardContent>
            </Card>

            {storageInfo && !error && (
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold">Storage Information</h3>
                        <p>Recommended Platform: {storageInfo.recommendedPlatform}</p>
                        {storageInfo.suggestUpgrade && (
                            <Alert className="mt-2 text-yellow-500">
                                Your storage is nearing its limit. Upgrade recommended!
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {uploadedFiles.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold">Uploaded Files</h3>
                        <ul className="grid gap-2">
                            {uploadedFiles.map((file, index) => (
                                <li key={index} className="text-gray-700 bg-gray-100 p-3 rounded-md">
                                    {file.name}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FileUpload;
