// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/AIGroups.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Select from "./ui/Select";
import Alert from "./ui/Alert";
import { Card, CardContent } from "./ui/Card";
import { logError, getErrorMessage } from "../utils/ErrorHandler";

const AIGroups = () => {
  const [groups, setGroups] = useState([]);
  const [models, setModels] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: "", selectedModels: [] });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchGroups();
    fetchAvailableModels();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get("/api/ai/groups");
      setGroups(res.data.groups || []);
    } catch (err) {
      logError(err, "AIGroups - fetchGroups");
      setErrorMessage("Failed to load AI groups.");
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const res = await axios.get("/api/ai/models");
      setModels(res.data.models || []);
    } catch (err) {
      logError(err, "AIGroups - fetchAvailableModels");
      setErrorMessage("Failed to load AI models.");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || newGroup.selectedModels.length === 0) {
      setErrorMessage("Please provide a group name and select at least one model.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/ai/groups", {
        name: newGroup.name,
        models: newGroup.selectedModels,
      });

      setGroups([...groups, response.data.group]);
      setSuccessMessage("✅ AI Group created successfully!");
      setNewGroup({ name: "", selectedModels: [] });
    } catch (err) {
      logError(err, "AIGroups - handleCreateGroup");
      setErrorMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
    }
  };

  const handleModelToggle = (model) => {
    const exists = newGroup.selectedModels.includes(model);
    const updatedModels = exists
      ? newGroup.selectedModels.filter((m) => m !== model)
      : [...newGroup.selectedModels, model];

    setNewGroup((prev) => ({ ...prev, selectedModels: updatedModels }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">🎯 Manage AI Groups</h1>

      {errorMessage && <Alert type="error">{errorMessage}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Create New Group Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-3">Create New AI Group</h2>
          <Input
            placeholder="Group Name"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-2 mb-3">
            {models.map((model) => (
              <label key={model} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newGroup.selectedModels.includes(model)}
                  onChange={() => handleModelToggle(model)}
                />
                <span>{model}</span>
              </label>
            ))}
          </div>
          <Button onClick={handleCreateGroup} disabled={loading}>
            {loading ? "Creating..." : "➕ Create Group"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Groups List */}
      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="bg-gray-100 shadow">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <p className="text-sm text-gray-600">Models: {group.models.join(", ")}</p>
              <p className="text-xs text-gray-400 mt-1">
                Created: {new Date(group.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIGroups;
