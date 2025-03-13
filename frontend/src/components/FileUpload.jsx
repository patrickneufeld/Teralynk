// ✅ FILE: /frontend/src/components/FileUpload.jsx

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { Loader } from "../components/ui/Loader";
import Modal from "../components/ui/Modal";

const MAX_FILE_SIZE_MB = 100;

const FileUpload = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [conflictingFile, setConflictingFile] = useState(null);

  useEffect(() => {
    if (pendingFiles.length === 0) return;
    uploadFiles(pendingFiles);
  }, [pendingFiles]);

  const checkStorage = async (file) => {
    try {
      const res = await axios.post("/api/storage/check", { fileSize: file.size });
      setStorageInfo(res.data);
      if (res.data.suggestUpgrade) {
        setError("⚠️ Storage is nearly full. Upgrade recommended.");
      }
      return res.data.recommendedPlatform;
    } catch (err) {
      console.error("Storage check error:", err);
      setError("Failed to evaluate storage.");
      return null;
    }
  };

  const checkConflict = async (fileName) => {
    try {
      const res = await axios.get(`/api/files/check-conflict?name=${encodeURIComponent(fileName)}`);
      return res.data.conflict;
    } catch (err) {
      console.error("Conflict check error:", err);
      return false;
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setError("");
    setSuccess("");
    setUploading(true);

    const tooLarge = acceptedFiles.find(file => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (tooLarge) {
      setError(`File '${tooLarge.name}' exceeds the max size of ${MAX_FILE_SIZE_MB}MB.`);
      setUploading(false);
      return;
    }

    for (const file of acceptedFiles) {
      const conflict = await checkConflict(file.name);
      if (conflict) {
        setConflictingFile(file);
        setOverwriteModalOpen(true);
        setUploading(false);
        return;
      }
    }

    setPendingFiles(acceptedFiles);
  }, []);

  const uploadFiles = async (files) => {
    try {
      const formData = new FormData();
      for (const file of files) {
        const recommendedPlatform = await checkStorage(file);
        if (!recommendedPlatform) throw new Error("Storage allocation failed.");
        formData.append("files", file);
      }

      const response = await axios.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadedFiles((prev) => [...prev, ...response.data.files]);
      setSuccess("✅ Files uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setPendingFiles([]);
    }
  };

  const confirmOverwrite = async () => {
    setOverwriteModalOpen(false);
    setPendingFiles([conflictingFile]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: "image/*,video/*,application/pdf",
  });

  const removeFile = async (fileName) => {
    try {
      await axios.delete(`/api/files/${fileName}`);
      setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    } catch (err) {
      console.error("Remove file error:", err);
    }
  };

  return (
    <div className="file-upload-container">
      <h2 className="text-xl font-bold text-center mb-4">📁 File Upload Manager</h2>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      {success && <Alert type="success" className="mb-4">{success}</Alert>}
      {uploading && <Loader className="mb-4" />}

      <Card className="mb-6">
        <CardContent
          {...getRootProps()}
          className="p-6 border-dashed border-2 border-gray-300 text-center rounded-md cursor-pointer hover:bg-gray-100"
        >
          <input {...getInputProps()} />
          <p>📂 Drag & Drop files or click to select (Max {MAX_FILE_SIZE_MB}MB)</p>
        </CardContent>
      </Card>

      {storageInfo && (
        <Card className="mb-4">
          <CardContent>
            <h4>🧠 Storage Recommendation</h4>
            <p>Recommended platform: {storageInfo.recommendedPlatform}</p>
            {storageInfo.suggestUpgrade && (
              <Alert type="warning">Your current plan is near capacity.</Alert>
            )}
          </CardContent>
        </Card>
      )}

      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent>
            <h4 className="font-semibold mb-2">✅ Uploaded Files</h4>
            <ul className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <li key={idx} className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button className="bg-red-500 text-white" onClick={() => removeFile(file.name)}>
                    ❌ Delete
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {overwriteModalOpen && conflictingFile && (
        <Modal
          title="⚠️ File Conflict Detected"
          confirmText="Overwrite File"
          onConfirm={confirmOverwrite}
          onClose={() => setOverwriteModalOpen(false)}
        >
          <p>
            A file named <strong>{conflictingFile.name}</strong> already exists.
            Would you like to overwrite it?
          </p>
        </Modal>
      )}
    </div>
  );
};

export default FileUpload;
