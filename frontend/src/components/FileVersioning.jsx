// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/FileVersioning.jsx

import React, { useState } from "react";
import axios from "axios";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import CardContent from "../components/ui/CardContent";
import Loader from "../components/ui/Loader";

const FileVersioning = () => {
  const [fileId, setFileId] = useState("");
  const [newContent, setNewContent] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateVersion = async () => {
    if (!fileId || !newContent || !versionLabel) {
      setErrorMessage("All fields are required: File ID, Version Label, and New Content.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await axios.post(
        "/api/files/version",
        { fileId, newContent, versionLabel, comment },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setSuccessMessage("✅ File version created successfully!");
        setNewContent("");
        setVersionLabel("");
        setComment("");
      } else {
        throw new Error("Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Versioning Error:", error);
      setErrorMessage("Failed to create file version. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">📁 File Versioning</h2>

      {successMessage && <Alert type="success" className="mb-4">{successMessage}</Alert>}
      {errorMessage && <Alert type="error" className="mb-4">{errorMessage}</Alert>}
      {loading && <Loader className="mb-4" />}

      <Card>
        <CardContent className="space-y-4">
          <Input
            label="File ID"
            type="text"
            value={fileId}
            onChange={(e) => setFileId(e.target.value)}
            placeholder="Enter file ID (e.g., 12345abc)"
            required
          />

          <Input
            label="Version Label"
            type="text"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            placeholder="e.g., v1.1, Draft, Final"
            required
          />

          <Textarea
            label="New File Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Paste or write new version content here..."
            rows={6}
            required
          />

          <Textarea
            label="Optional Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a note about this version (optional)"
            rows={3}
          />

          <Button
            onClick={handleCreateVersion}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            {loading ? "Creating Version..." : "➕ Create New Version"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileVersioning;
