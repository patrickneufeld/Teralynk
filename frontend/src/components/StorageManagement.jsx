import React, { useEffect, useState } from "react";
import { getStorageUsage, upgradeStorage, uploadFile, getLowestCostProvider } from "../services/storageService";
import { getStoredCredentials, saveCredentials, validateCredentials } from "../utils/credentialUtils";
import { createWebSocket } from "../utils/websocketClient";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Modal from "./ui/Modal";
import Loader from "./ui/Loader";
import DragAndDrop from "./ui/DragAndDrop";
import FileList from "./ui/FileList";
import { logAuditEvent } from "../utils/auditLogger";
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
  const [fileUploadError, setFileUploadError] = useState("");

  useEffect(() => {
    fetchStorageData();
    const socket = createWebSocket("/ws/storage", {
      onMessage: (updatedData) => {
        console.log("📦 Live Storage Update:", updatedData);
        setPlatforms(updatedData);
      },
      onError: (err) => console.error("❌ WebSocket error in StorageManagement:", err),
      onClose: () => console.warn("🟡 WebSocket disconnected for storage updates."),
    });

    return () => socket.close();
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
      console.error("❌ Error fetching storage:", err);
      setError("⚠️ Error loading storage data.");
    } finally {
      setLoading(false);
    }
  };

  const checkStorageLimits = (data) => {
    const nearingLimit = data.filter((p) => p.used >= p.limit * 0.9);
    return nearingLimit.length > 0
      ? `⚠️ Warning: Nearing limit for ${nearingLimit.map((p) => p.name).join(", ")}.`
      : "";
  };

  const handleUpgradeStorage = async (platformId) => {
    try {
      setLoading(true);
      await upgradeStorage(platformId);
      logAuditEvent("Storage Upgraded", { platformId });
      setSuccessMessage("✅ Storage upgraded successfully!");
      fetchStorageData();
    } catch (err) {
      console.error("❌ handleUpgradeStorage:", err);
      setError("❌ Storage upgrade failed.");
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
      console.error("❌ handleCredentialSave:", err);
      setError("❌ Failed to save credentials.");
    }
  };

  const handleFileUpload = async (files) => {
    setFileUploadError("");
    try {
      for (const file of files) {
        const lowestCostProvider = await getLowestCostProvider();
        await uploadFile(lowestCostProvider.id, file);
        logAuditEvent("File Uploaded", { fileName: file.name, providerId: lowestCostProvider.id });
      }
      fetchStorageData();
    } catch (err) {
      console.error("❌ handleFileUpload:", err);
      setFileUploadError("❌ File upload failed.");
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

      <DragAndDrop onFilesDropped={handleFileUpload} />

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
                <Button onClick={() => handleUpgradeStorage(platform.id)}>
                  🚀 Upgrade Storage
                </Button>
                <Button onClick={() => openCredentialModal(platform)}>
                  🔑 Manage Credentials
                </Button>
              </div>

              <FileList files={platform.files || []} />
            </li>
          ))}
        </ul>
      )}

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
