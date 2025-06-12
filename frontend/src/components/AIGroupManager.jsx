import React, { useState, useEffect, useRef } from "react";
import "../styles/components/AIGroupManager.css";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import Modal from "./ui/Modal"; // Ensure you have a modal component
import { fetchAIModels, fetchUserGroups, saveAIGroup, deleteAIGroup } from "../utils/aiService"; // API Helpers

const AIGroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", models: [], tags: [] });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Load AI models and user groups on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const models = await fetchAIModels();
        const userGroups = await fetchUserGroups();
        setAvailableModels(models);
        setGroups(userGroups);
      } catch (err) {
        console.error("Error loading AI models/groups:", err);
        setError("Failed to load AI models or groups.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle adding a new AI group
  const handleAddGroup = async () => {
    if (!newGroup.name.trim()) {
      setError("Group name cannot be empty!");
      return;
    }
    if (newGroup.models.length === 0) {
      setError("Select at least one AI model.");
      return;
    }

    try {
      const savedGroup = await saveAIGroup(newGroup);
      setGroups([...groups, savedGroup]);
      setNewGroup({ name: "", models: [], tags: [] });
      setSuccess("✅ AI Group added successfully!");
    } catch (err) {
      setError("Failed to save AI group.");
    }
  };

  // Handle deleting an AI group
  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteAIGroup(groupId);
      setGroups(groups.filter((g) => g.id !== groupId));
      setSuccess("✅ AI Group deleted successfully.");
    } catch (err) {
      setError("Failed to delete AI group.");
    }
  };

  // Handle importing AI groups from file
  const handleImport = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedGroups = JSON.parse(e.target.result);
        setGroups([...groups, ...importedGroups]);
        setSuccess("✅ AI Groups imported successfully.");
      } catch (err) {
        setError("Failed to import AI groups.");
      }
    };
    reader.readAsText(file);
  };

  // Handle exporting AI groups to file
  const handleExport = () => {
    const dataStr = JSON.stringify(groups, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-groups.json";
    a.click();
  };

  return (
    <div className="ai-group-manager">
      <h1 className="title">🤖 AI Group Manager</h1>

      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {/* New AI Group Section */}
      <section className="new-group-section">
        <h2>Add AI Group</h2>
        <Input
          type="text"
          placeholder="Group Name (e.g., Content Creators)"
          value={newGroup.name}
          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
        />

        {/* AI Model Selection */}
        <label>Select AI Models:</label>
        <Select
          multiple
          value={newGroup.models}
          onChange={(e) =>
            setNewGroup({ ...newGroup, models: [...e.target.selectedOptions].map(o => o.value) })
          }
        >
          {availableModels.map((model) => (
            <option key={model.id} value={model.name}>
              {model.name}
            </option>
          ))}
        </Select>

        {/* Tags */}
        <Input
          type="text"
          placeholder="Add Tags (comma-separated)"
          value={newGroup.tags.join(", ")}
          onChange={(e) => {
            const tags = e.target.value.split(",").map((tag) => tag.trim());
            setNewGroup({ ...newGroup, tags });
          }}
        />

        <Button onClick={handleAddGroup}>➕ Add Group</Button>
      </section>

      {/* AI Groups List */}
      <section className="groups-section">
        <h2>My AI Groups</h2>
        {loading ? (
          <p>Loading AI Groups...</p>
        ) : groups.length === 0 ? (
          <p>No AI Groups available.</p>
        ) : (
          <ul className="group-list">
            {groups.map((group) => (
              <li key={group.id} className="group-card">
                <h3>{group.name}</h3>
                <p>Models: {group.models.join(", ")}</p>
                <p>Tags: {group.tags.join(", ")}</p>
                <Button onClick={() => handleDeleteGroup(group.id)} className="delete-button">
                  🗑 Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Import/Export Section */}
      <section className="export-import-section">
        <Button onClick={handleExport}>📥 Export</Button>
        <Button onClick={() => fileInputRef.current.click()}>📤 Import</Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleImport}
        />
      </section>

      {/* Modal for managing group actions */}
      {showModal && <Modal onClose={() => setShowModal(false)}>{/* Modal Content */}</Modal>}
    </div>
  );
};

export default AIGroupManager;
