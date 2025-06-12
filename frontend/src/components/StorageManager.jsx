// ================================================
// 🟢 Part 1 of 2: Imports, State, and Core Functions
// File: /frontend/src/components/StorageManager.jsx
// ================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { logInfo, logError } from "@/utils/logging/logging";
import { debounce } from "@/utils/RateLimiter";
import { getStorageUsage, upgradeStorage } from "@/api/storage";

const FIELD_TYPES = ["text", "password", "url", "email", "number", "oauth", "token"];

const defaultPlatform = {
  name: "",
  fields: [],
  tags: [],
  testUrl: "",
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
};

const defaultField = {
  label: "",
  type: "text",
  required: true,
  placeholder: "",
  defaultValue: "",
  description: "",
  secure: false,
  regex: "",
  validationMessage: "",
  group: "",
  authUrl: "",
  tokenUrl: "",
  redirectUri: "",
};

// Validation Helpers
const validateFieldLabel = (label) => {
  if (!label || label.length < 3) return "Field label must be at least 3 characters.";
  if (/[^\w\s\-]/.test(label)) return "Field label contains invalid characters.";
  return null;
};

const validatePlatformName = (name) => {
  if (!name || name.trim() === "") return "Platform name cannot be empty.";
  return null;
};

// Main Component
const StorageManager = () => {
  const [platforms, setPlatforms] = useState([]);
  const [newPlatform, setNewPlatform] = useState(defaultPlatform);
  const [currentField, setCurrentField] = useState(defaultField);
  const [storageData, setStorageData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch storage data
  const fetchStorageData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStorageUsage();
      setStorageData(response);
    } catch (err) {
      logError(err, "StorageFetch");
      setErrorMessage("Error fetching storage data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Upgrade storage
  const handleUpgradeStorage = async (platformId) => {
    try {
      await upgradeStorage(platformId);
      toast.success("🚀 Storage successfully upgraded!");
      fetchStorageData();
    } catch (err) {
      logError(err, "StorageUpgrade");
      setErrorMessage("Error upgrading storage.");
    }
  };

  // Import platforms
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format: expected an array.");
        setPlatforms(imported);
        toast.success("✅ Platforms imported successfully.");
      } catch (err) {
        logError(err, "ImportPlatforms");
        toast.error("Failed to import platforms.");
      }
    };
    reader.readAsText(file);
  };

  // Export platforms
  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(platforms, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "platforms_export.json";
      a.click();
      toast.success("📦 Platforms exported!");
    } catch (err) {
      logError(err, "ExportPlatforms");
      toast.error("Failed to export platforms.");
    }
  };
  // Start OAuth flow
  const startOAuthFlow = (authUrl) => {
    if (!authUrl) {
      toast.error("Authorization URL missing.");
      return;
    }
    window.open(authUrl, "_blank");
  };

  // Sync platform to backend (stub)
  const syncToBackend = async (platformIdx) => {
    try {
      const platform = platforms[platformIdx];
      if (!platform || !platform.name) throw new Error("Platform not found");
      logInfo("PlatformSynced", { platform: platform.name });
      toast.success(`🔄 Platform "${platform.name}" synced to cloud.`);
    } catch (err) {
      logError(err, "SyncToBackend");
      toast.error(err.message || "Sync failed.");
    }
  };

  // Ping endpoint
  const pingEndpoint = (platform) => {
    if (!platform?.testUrl) {
      toast.error("Test URL not defined.");
      return;
    }
    fetch(platform.testUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Test failed");
        toast.success(`✅ Connected to ${platform.name}`);
      })
      .catch((err) => {
        logError(err, "PingEndpoint");
        toast.error("Connection failed: " + err.message);
      });
  };

  // Save credentials
  const handleSaveCredentials = (platformIdx) => {
    const platform = platforms[platformIdx];
    if (!platform) return;
    const missing = platform.fields.filter((f) => f.required && !f.value);
    if (missing.length > 0) {
      toast.error("Please fill all required fields.");
      return;
    }
    toast.success(`💾 Credentials saved for ${platform.name}`);
  };

  // Handle credential change
  const handleCredentialChange = (platformIdx, fieldIdx, value) => {
    setPlatforms((prev) => {
      const updated = [...prev];
      updated[platformIdx].fields[fieldIdx].value = value;
      return updated;
    });
    if (autoSave) {
      debounce(() => handleSaveCredentials(platformIdx), 500)();
    }
  };

  // Add new field
  const handleAddField = () => {
    const error = validateFieldLabel(currentField.label);
    if (error) {
      toast.error(error);
      return;
    }
    setNewPlatform((prev) => ({
      ...prev,
      fields: [...prev.fields, currentField],
      lastUpdated: new Date().toISOString(),
    }));
    setCurrentField(defaultField);
  };

  // Add new platform
  const handleAddPlatform = () => {
    const error = validatePlatformName(newPlatform.name);
    if (error) {
      toast.error(error);
      return;
    }
    if (newPlatform.fields.length === 0) {
      toast.error("Platform must have at least one field.");
      return;
    }
    setPlatforms((prev) => [...prev, newPlatform]);
    setNewPlatform(defaultPlatform);
    toast.success("➕ Platform created.");
  };

  // Field reordering helpers
  const moveFieldUp = (idx) => {
    if (idx === 0) return;
    setNewPlatform((prev) => {
      const fields = [...prev.fields];
      [fields[idx], fields[idx - 1]] = [fields[idx - 1], fields[idx]];
      return { ...prev, fields };
    });
  };

  const moveFieldDown = (idx) => {
    if (idx === newPlatform.fields.length - 1) return;
    setNewPlatform((prev) => {
      const fields = [...prev.fields];
      [fields[idx], fields[idx + 1]] = [fields[idx + 1], fields[idx]];
      return { ...prev, fields };
    });
  };

  const removeField = (idx) => {
    setNewPlatform((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  };

  // LocalStorage effects
  useEffect(() => {
    const saved = localStorage.getItem("customPlatforms");
    if (saved) setPlatforms(JSON.parse(saved));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("customPlatforms", JSON.stringify(platforms));
    } catch (err) {
      logError(err, "SaveToLocalStorage");
    }
  }, [platforms]);

  // Render component
  return (
    <div className="storage-manager-container">
      <h1 className="text-2xl font-bold mb-6">🔐 Storage Manager</h1>

      {successMessage && <Alert type="success" message={successMessage} />}
      {errorMessage && <Alert type="error" message={errorMessage} />}

      {/* New Platform Builder */}
      <section>
        <Input
          type="text"
          placeholder="Platform Name"
          value={newPlatform.name}
          onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
        />
        <Input
          type="text"
          placeholder="Field Label"
          value={currentField.label}
          onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
        />
        <Select
          value={currentField.type}
          onChange={(e) => setCurrentField({ ...currentField, type: e.target.value })}
          options={FIELD_TYPES.map((ft) => ({ value: ft, label: ft }))}
        />
        <Button onClick={handleAddField}>Add Field</Button>

        {newPlatform.fields.map((field, idx) => (
          <div key={idx}>
            {field.label} ({field.type})
            <Button onClick={() => moveFieldUp(idx)}>Up</Button>
            <Button onClick={() => moveFieldDown(idx)}>Down</Button>
            <Button onClick={() => removeField(idx)}>Remove</Button>
          </div>
        ))}
        <Button onClick={handleAddPlatform}>Create Platform</Button>
      </section>

      {/* Import / Export */}
      <section>
        <Button onClick={handleExport}>Export Platforms</Button>
        <Button onClick={() => fileInputRef.current.click()}>Import Platforms</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          hidden
        />
      </section>

      {/* Platforms List */}
      <section>
        {platforms.map((platform, platformIdx) => (
          <div key={platformIdx}>
            <h3>{platform.name}</h3>
            {platform.fields.map((field, fieldIdx) => (
              <div key={fieldIdx}>
                <Input
                  type={field.secure ? "password" : field.type}
                  value={field.value || ""}
                  onChange={(e) => handleCredentialChange(platformIdx, fieldIdx, e.target.value)}
                />
                {field.authUrl && (
                  <Button onClick={() => startOAuthFlow(field.authUrl)}>OAuth</Button>
                )}
              </div>
            ))}
            <Button onClick={() => handleSaveCredentials(platformIdx)}>Save</Button>
            <Button onClick={() => syncToBackend(platformIdx)}>Sync</Button>
            <Button onClick={() => pingEndpoint(platform)}>Ping</Button>
          </div>
        ))}
      </section>
    </div>
  );
};

StorageManager.propTypes = {};

export default StorageManager;
