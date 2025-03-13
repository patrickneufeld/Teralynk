import React, { useEffect, useState, useRef } from "react";
import { getStorageUsage, upgradeStorage, uploadFile, getLowestCostProvider } from "../services/storageService";
import { getStoredCredentials, saveCredentials, validateCredentials } from "../utils/credentialUtils";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Modal from "./ui/Modal";
import Loader from "./ui/Loader";
import DragAndDrop from "./ui/DragAndDrop"; // ✅ New: Drag & Drop
import FileList from "./ui/FileList"; // ✅ New: File Management
import { logAuditEvent } from "../utils/auditLogger"; // ✅ New: Audit Logs
import "../styles/components/StorageManagement.css";

export default function StorageManagement() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [fileQueue, setFileQueue] = useState([]);
  const [fileUploadError, setFileUploadError] = useState("");

  // ✅ WebSocket for real-time storage updates
  useEffect(() => {
    fetchStorageData();
    const ws = new WebSocket("ws://localhost:8001/ws/storage");
    ws.onmessage = (event) => {
      const updatedData = JSON.parse(event.data);
      setPlatforms(updatedData);
    };
    return () => ws.close();
  }, []);

  const fetchStorageData = async () => {
    setLoading(true);
    setError("");
    try {
      const usageResponse = await getStorageUsage();
      const credentialResponse = await getStoredCredentials();

      const platformsWithCredentials = usageResponse.data.map((platform) => ({
        ...platform,
        credentials: credentialResponse[platform.id] || {},
      }));

      setPlatforms(platformsWithCredentials);
      setNotification(checkStorageLimits(platformsWithCredentials));
    } catch (err) {
      setError("⚠️ Error loading storage data.");
      console.error("❌ fetchStorageData:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkStorageLimits = (data) => {
    const nearingLimit = data.filter((p) => p.used >= p.limit * 0.9);
    if (nearingLimit.length > 0) {
      return `⚠️ Warning: You're nearing the limit for ${nearingLimit.map(p => p.name).join(", ")}.`;
    }
    return "";
  };

  const handleUpgradeStorage = async (platformId) => {
    try {
      setLoading(true);
      await upgradeStorage(platformId);
      logAuditEvent("Storage Upgraded", { platformId });
      setSuccessMessage("✅ Storage upgraded successfully!");
      fetchStorageData();
    } catch (err) {
      setError("❌ Storage upgrade failed.");
      console.error("❌ handleUpgradeStorage:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCredentialModal = (platform) => {
    setSelectedPlatform(platform);
    setCredentials(platform.credentials || {});
    setShowCredentialModal(true);
  };

  const handleCredentialChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleCredentialSave = async () => {
    try {
      if (!selectedPlatform) return;
      const validationErrors = validateCredentials(credentials);
      if (validationErrors.length > 0) {
        setError(`❌ Invalid credentials: ${validationErrors.join(", ")}`);
        return;
      }
      await saveCredentials(selectedPlatform.id, credentials);
      logAuditEvent("Credential Updated", { platformId: selectedPlatform.id });
      setSuccessMessage(`✅ Credentials saved for ${selectedPlatform.name}.`);
      setShowCredentialModal(false);
      fetchStorageData();
    } catch (err) {
      setError("❌ Failed to save credentials.");
      console.error("❌ handleCredentialSave:", err);
    }
  };

  const handleFileUpload = async (files) => {
    setFileUploadError("");
    try {
      for (const file of files) {
        const lowestCostProvider = await getLowestCostProvider();
        const duplicateExists = platforms.some((p) => p.files?.some((f) => f.name === file.name));

        if (duplicateExists) {
          const userConfirmed = window.confirm(`File "${file.name}" already exists. Overwrite?`);
          if (!userConfirmed) continue;
        }

        await uploadFile(lowestCostProvider.id, file);
        logAuditEvent("File Uploaded", { fileName: file.name, provider: lowestCostProvider.name });
      }
      fetchStorageData();
    } catch (err) {
      setFileUploadError("❌ File upload failed.");
      console.error("❌ handleFileUpload:", err);
    }
  };

  return (
    <div className="storage-management-container">
      <h2 className="title">📦 Storage Management</h2>

      {error && <Alert type="error">{error}</Alert>}
      {notification && <Alert type="warning">{notification}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {fileUploadError && <Alert type="error">{fileUploadError}</Alert>}
      {loading && <Loader className="mt-4" />}

      {/* File Upload with Drag & Drop */}
      <DragAndDrop onFilesDropped={handleFileUpload} />

      {/* Platform Storage List */}
      {!loading && platforms.length > 0 && (
        <ul className="platform-list">
          {platforms.map((platform) => (
            <li key={platform.id} className="platform-card">
              <div className="platform-header">
                <h3>{platform.name}</h3>
                <p className="usage">
                  {platform.used}GB / {platform.limit}GB used
                </p>
              </div>

              {platform.used >= platform.limit && (
                <p className="limit-warning">⚠️ Limit reached. Upgrade required.</p>
              )}

              <div className="platform-actions">
                <Button
                  className="upgrade-btn"
                  onClick={() => handleUpgradeStorage(platform.id)}
                  disabled={platform.used < platform.limit}
                >
                  🚀 Upgrade Storage
                </Button>
                <Button
                  className="credentials-btn"
                  onClick={() => openCredentialModal(platform)}
                >
                  🔑 Manage Credentials
                </Button>
              </div>

              <FileList files={platform.files || []} />
            </li>
          ))}
        </ul>
      )}

      {/* Modal: Manage Credentials */}
      {showCredentialModal && selectedPlatform && (
        <Modal
          title={`🔐 Credentials for ${selectedPlatform.name}`}
          onClose={() => setShowCredentialModal(false)}
          onConfirm={handleCredentialSave}
          confirmText="Save Credentials"
        >
          {selectedPlatform.credentialFields.map((field) => (
            <div key={field} className="form-group">
              <label>{field}</label>
              <Input
                value={credentials[field] || ""}
                onChange={(e) => handleCredentialChange(field, e.target.value)}
                placeholder={`Enter ${field}`}
              />
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
