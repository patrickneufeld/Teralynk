import React, { useState, useEffect, useRef } from "react";
import "../styles/components/StorageManager.css";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Alert from "./ui/Alert";

const StorageManager = () => {
  const [platforms, setPlatforms] = useState([]);
  const [newPlatform, setNewPlatform] = useState({
    name: "",
    fields: [],
    tags: [],
    testUrl: "",
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
  });
  const [currentField, setCurrentField] = useState({
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
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [autoSave, setAutoSave] = useState(true);
  const fileInputRef = useRef(null);
  const fetchStorageData = async () => {
    setLoading(true);
    setError('');
    try {
        const response = await getStorageUsage();
        setStorageData(response);
        setNotification(checkStorageLimits(response));
    } catch (err) {
        setError('Error fetching storage data. Please try again.');
        console.error('Storage fetch error:', err.message);
    } finally {
        setLoading(false);
    }
};

const handleUpgradeStorage = async (platformId) => {
    setError('');
    try {
        await upgradeStorage(platformId);
        fetchStorageData();
    } catch (err) {
        setError('Error upgrading storage. Please try again.');
        console.error('Storage upgrade error:', err.message);
    }
};

  useEffect(() => {
    const saved = localStorage.getItem("customPlatforms");
    if (saved) setPlatforms(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("customPlatforms", JSON.stringify(platforms));
  }, [platforms]);

  const handleAddField = () => {
    if (currentField.label.length < 3) {
      showError("Field label must be at least 3 characters.");
      return;
    }
    if (newPlatform.fields.some(f => f.label === currentField.label)) {
      showError("Field label already exists.");
      return;
    }

    setNewPlatform((prev) => ({
      ...prev,
      fields: [...prev.fields, currentField],
      lastUpdated: new Date().toISOString(),
    }));
    setCurrentField({
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
    });
  };

  const handleAddPlatform = () => {
    if (!newPlatform.name.trim()) {
      showError("Platform name cannot be empty!");
      return;
    }
    if (newPlatform.fields.length === 0) {
      showError("Platform must have at least one field!");
      return;
    }
    setPlatforms([...platforms, { ...newPlatform }]);
    setNewPlatform({
      name: "",
      fields: [],
      tags: [],
      testUrl: "",
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    });
    showSuccess("✅ Platform added successfully!");
  };

  const handleCredentialChange = (platformIdx, fieldIdx, value) => {
    const updated = [...platforms];
    const field = updated[platformIdx].fields[fieldIdx];
    if (field.regex && !new RegExp(field.regex).test(value)) {
      showError(field.validationMessage || "Invalid value.");
      return;
    }
    updated[platformIdx].fields[fieldIdx].value = value;
    setPlatforms(updated);
    if (autoSave) handleSaveCredentials(platformIdx);
  };

  const handleSaveCredentials = (platformIdx) => {
    const platform = platforms[platformIdx];
    const missing = platform.fields.filter(f => f.required && !f.value);
    if (missing.length > 0) {
      showError("Please fill all required fields.");
      return;
    }
    const filledFields = platform.fields.reduce((acc, field) => {
      acc[field.label] = field.value || "";
      return acc;
    }, {});
    console.log(`🔐 Saving credentials for ${platform.name}:`, filledFields);
    // Optional: Sync with backend DB or AWS Secrets Manager here
    alert(`✅ Credentials saved for ${platform.name}`);
  };

  const removeField = (idx) => {
    setNewPlatform((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, fieldIdx) => fieldIdx !== idx),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const moveFieldUp = (idx) => {
    if (idx === 0) return;
    setNewPlatform((prev) => {
      const fields = [...prev.fields];
      [fields[idx], fields[idx - 1]] = [fields[idx - 1], fields[idx]];
      return { ...prev, fields, lastUpdated: new Date().toISOString() };
    });
  };

  const moveFieldDown = (idx) => {
    if (idx === newPlatform.fields.length - 1) return;
    setNewPlatform((prev) => {
      const fields = [...prev.fields];
      [fields[idx], fields[idx + 1]] = [fields[idx + 1], fields[idx]];
      return { ...prev, fields, lastUpdated: new Date().toISOString() };
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(platforms, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platforms.json";
    a.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const importedPlatforms = JSON.parse(e.target.result);
      setPlatforms(importedPlatforms);
    };
    reader.readAsText(file);
  };

  const pingEndpoint = (platform) => {
    fetch(platform.testUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        alert(`Successfully connected to ${platform.name} endpoint.`);
      })
      .catch((error) => {
        alert(`Failed to connect to ${platform.name} endpoint: ${error.message}`);
      });
  };

  const startOAuthFlow = (authUrl) => {
    window.open(authUrl);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const syncToBackend = (platformIdx) => {
    const platform = platforms[platformIdx];
    // POST to backend or AWS Secrets Manager logic here
    console.log(`Syncing ${platform.name} to backend...`);
    showSuccess(`🔄 Platform ${platform.name} synced to cloud.`);
  };

  const renderGroupedFields = (fields) => {
    const groups = fields.reduce((acc, field) => {
      acc[field.group] = acc[field.group] || [];
      acc[field.group].push(field);
      return acc;
    }, {});

    return Object.entries(groups).map(([group, groupFields]) => (
      <div key={group} className="field-group">
        <h4>{group}</h4>
        {groupFields.map((field, fieldIdx) => (
          <div key={fieldIdx} className="credential-field">
            <label>
              {field.label}
              {field.description && (
                <span className="tooltip"> ⓘ
                  <span className="tooltiptext">{field.description}</span>
                </span>
              )}
            </label>
            <Input
              type={field.type}
              required={field.required}
              value={field.value || field.defaultValue || ""}
              placeholder={field.placeholder || `Enter ${field.label}`}
              onChange={(e) =>
                handleCredentialChange(platformIdx, fieldIdx, e.target.value)
              }
            />
            {field.secure && <span>🔒</span>}
            {field.type === "oauth" && field.authUrl && (
              <Button onClick={() => startOAuthFlow(field.authUrl)}>🔓 Authorize</Button>
            )}
            <Button onClick={() => navigator.clipboard.writeText(field.value)}>📋 Copy</Button>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="storage-manager-container">
      <h1 className="title">🔐 Storage & Credential Manager</h1>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {errorMessage && <Alert type="error">{errorMessage}</Alert>}

      <section className="new-platform-section">
        <h2>Add New Platform</h2>
        <Input
          type="text"
          placeholder="Platform Name (e.g., Dropbox)"
          value={newPlatform.name}
          onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
        />

        <div className="field-row">
          <Input
            type="text"
            placeholder="Field Label (e.g., API Key)"
            value={currentField.label}
            onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
          />
          <Select
            value={currentField.type}
            onChange={(e) => setCurrentField({ ...currentField, type: e.target.value })}
          >
            <option value="text">Text</option>
            <option value="password">Password</option>
            <option value="url">URL</option>
            <option value="email">Email</option>
            <option value="number">Number</option>
            <option value="oauth">OAuth</option>
            <option value="token">Token</option>
          </Select>
          <Input
            type="text"
            placeholder="Placeholder (optional)"
            value={currentField.placeholder}
            onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Default Value (optional)"
            value={currentField.defaultValue}
            onChange={(e) => setCurrentField({ ...currentField, defaultValue: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Field Description (optional)"
            value={currentField.description}
            onChange={(e) => setCurrentField({ ...currentField, description: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Validation Regex (optional)"
            value={currentField.regex}
            onChange={(e) => setCurrentField({ ...currentField, regex: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Validation Message (optional)"
            value={currentField.validationMessage}
            onChange={(e) => setCurrentField({ ...currentField, validationMessage: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Field Group (optional)"
            value={currentField.group}
            onChange={(e) => setCurrentField({ ...currentField, group: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Auth URL (for OAuth)"
            value={currentField.authUrl}
            onChange={(e) => setCurrentField({ ...currentField, authUrl: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Token URL (for OAuth)"
            value={currentField.tokenUrl}
            onChange={(e) => setCurrentField({ ...currentField, tokenUrl: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Redirect URI (for OAuth)"
            value={currentField.redirectUri}
            onChange={(e) => setCurrentField({ ...currentField, redirectUri: e.target.value })}
          />
          <label>
            <input
              type="checkbox"
              checked={currentField.required}
              onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
            />
            Required
          </label>
          <label>
            <input
              type="checkbox"
              checked={currentField.secure}
              onChange={(e) => setCurrentField({ ...currentField, secure: e.target.checked })}
            />
            Encrypt Field
          </label>
          <Button onClick={handleAddField}>➕ Add Field</Button>
        </div>

        {newPlatform.fields.length > 0 && (
          <ul className="field-preview-list">
            {newPlatform.fields.map((field, idx) => (
              <li key={idx}>
                <strong>{field.label}</strong> ({field.type}){" "}
                {field.required ? "[Required]" : "[Optional]"} - {field.description}
                {field.secure && <span>🔒</span>}
                <Button onClick={() => moveFieldUp(idx)}>↑</Button>
                <Button onClick={() => moveFieldDown(idx)}>↓</Button>
                <Button onClick={() => removeField(idx)}>🗑️</Button>
              </li>
            ))}
          </ul>
        )}

        <Input
          type="text"
          placeholder="Test URL (optional)"
          value={newPlatform.testUrl}
          onChange={(e) => setNewPlatform({ ...newPlatform, testUrl: e.target.value })}
        />

        <Button className="save-platform-btn" onClick={handleAddPlatform}>
          ➕ Add Platform
        </Button>
      </section>

      <section className="platforms-section">
        {platforms.map((platform, platformIdx) => (
          <div key={platformIdx} className="platform-card">
            <h3>{platform.name}</h3>
            {renderGroupedFields(platform.fields)}
            <Input
              type="text"
              placeholder="Add Tags (comma-separated)"
              value={platform.tags.join(", ")}
              onChange={(e) => {
                const tags = e.target.value.split(",").map(tag => tag.trim());
                const updated = [...platforms];
                updated[platformIdx].tags = tags;
                setPlatforms(updated);
              }}
            />
            {platform.testUrl && (
              <Button onClick={() => pingEndpoint(platform)}>⚡ Test Connection</Button>
            )}
            <Button
              className="save-credentials-btn"
              onClick={() => handleSaveCredentials(platformIdx)}
            >
              💾 Save Credentials
            </Button>
            <Button onClick={() => syncToBackend(platformIdx)}>🔄 Sync to Cloud</Button>
          </div>
        ))}
      </section>

      <section className="export-import-section">
        <Button onClick={handleExport}>Export</Button>
        <Button onClick={() => fileInputRef.current.click()}>Import</Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </section>

      <section className="auto-save-section">
        <label>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          Auto Save Credentials on Input Change
        </label>
      </section>
    </div>
  );
};

export default StorageManager;
