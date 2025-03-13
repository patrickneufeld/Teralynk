// ✅ FILE: /Users/patrick/Projects/Teralynk/frontend/src/components/TemplateCloner.jsx

import React, { useState } from "react";
import axios from "axios";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Modal from "./ui/Modal";
import Loader from "./ui/Loader";
import { Card, CardContent } from "./ui/Card";
import "../styles/components/TemplateCloner.css";

const TemplateCloner = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newName, setNewName] = useState("");
  const [replacements, setReplacements] = useState([{ find: "", replace: "" }]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [clonedFiles, setClonedFiles] = useState([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setErrorMsg("Please enter a search term.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await axios.get("/api/templates/search", {
        params: { query: searchTerm },
        withCredentials: true,
      });

      if (response.data?.matches?.length > 0) {
        setMatches(response.data.matches);
        setSuccessMsg(`Found ${response.data.matches.length} file(s).`);
      } else {
        setSuccessMsg("No matching templates found.");
      }
    } catch (err) {
      console.error("❌ Template search error:", err);
      setErrorMsg("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReplacement = () => {
    setReplacements([...replacements, { find: "", replace: "" }]);
  };

  const handleChangeReplacement = (index, key, value) => {
    const updated = [...replacements];
    updated[index][key] = value;
    setReplacements(updated);
  };

  const handleClone = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        "/api/templates/clone",
        {
          original: matches[0].path,
          newName,
          replacements,
        },
        { withCredentials: true }
      );

      setClonedFiles([response.data.newPath]);
      setSuccessMsg(`✅ Cloned and updated file created: ${response.data.newPath}`);
      setMatches([]);
    } catch (err) {
      console.error("❌ Clone error:", err);
      setErrorMsg("Cloning failed. Please try again.");
    } finally {
      setLoading(false);
      setConfirmModal(false);
    }
  };

  return (
    <div className="template-cloner-container">
      <h2 className="template-cloner-title">📄 Clone & Customize Templates</h2>

      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {loading && <Loader className="mb-4" />}

      <div className="template-search-section">
        <Input
          placeholder="Search for template (e.g., 'sales-pitch')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleSearch} disabled={loading}>
          Search Templates
        </Button>
      </div>

      {matches.length > 0 && (
        <div className="template-details">
          <Card>
            <CardContent>
              <p><strong>Original:</strong> {matches[0].name}</p>
              <Input
                placeholder="Enter new file name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="replacement-list">
                {replacements.map((r, idx) => (
                  <div key={idx} className="replacement-row">
                    <Input
                      placeholder="Find"
                      value={r.find}
                      onChange={(e) => handleChangeReplacement(idx, "find", e.target.value)}
                    />
                    <Input
                      placeholder="Replace"
                      value={r.replace}
                      onChange={(e) => handleChangeReplacement(idx, "replace", e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleAddReplacement} className="mt-2">
                ➕ Add Replacement
              </Button>
              <Button
                onClick={() => setConfirmModal(true)}
                disabled={!newName || replacements.some(r => !r.find || !r.replace)}
                className="mt-4 bg-blue-600 text-white"
              >
                🚀 Clone & Apply Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {confirmModal && (
        <Modal
          title="⚠️ Confirm Clone & Replace"
          onClose={() => setConfirmModal(false)}
          onConfirm={handleClone}
          confirmText="Yes, Proceed"
        >
          <p>You're about to clone <strong>{matches[0].name}</strong> as <strong>{newName}</strong> with the following changes:</p>
          <ul className="mt-3 list-disc list-inside text-sm">
            {replacements.map((r, i) => (
              <li key={i}>
                <strong>{r.find}</strong> ➜ <span className="text-green-600">{r.replace}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-4">This action will create a new file with the updated content.</p>
        </Modal>
      )}

      {clonedFiles.length > 0 && (
        <div className="cloned-file-summary mt-6">
          <h3 className="text-lg font-semibold mb-2">📁 New File Created</h3>
          <ul>
            {clonedFiles.map((f, idx) => (
              <li key={idx} className="text-sm bg-green-50 p-2 rounded">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TemplateCloner;
