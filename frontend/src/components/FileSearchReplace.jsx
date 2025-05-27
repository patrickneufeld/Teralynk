import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import Modal from "./ui/Modal";
import { Card, CardContent } from "./ui/Card";
import Loader from "./ui/Loader";
import { useWebSocket } from "../hooks/useWebSocket"; // Custom WebSocket hook
import "../styles/components/FileSearchReplace.css";

const FileSearchReplace = () => {
  const [searchPairs, setSearchPairs] = useState([{ search: "", replace: "" }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [replacedFiles, setReplacedFiles] = useState([]);
  const [renameMap, setRenameMap] = useState({});
  const [saveAsNew, setSaveAsNew] = useState(true);

  // WebSocket integration
  const { sendMessage, lastMessage } = useWebSocket("/file-operations", {
    onMessage: (message) => {
      // Handle incoming messages from WebSocket
      console.log("WebSocket message received:", message);
      if (message.type === "searchProgress") {
        // Update search progress in the UI
        setSuccessMsg(message.data);
      } else if (message.type === "replaceProgress") {
        // Update replace progress in the UI
        setSuccessMsg(message.data);
      }
    },
  });

  const handleSearch = async () => {
    const searchTerms = searchPairs.map((p) => p.search).filter(Boolean);
    if (searchTerms.length === 0) {
      setErrorMsg("Please enter at least one search term.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setResults([]);

    // Send WebSocket message to start search operation
    sendMessage({ type: "startSearch", payload: { searchTerms } });

    try {
      const response = await axios.get("/api/files/search-content", {
        params: { query: searchTerms },
        withCredentials: true,
      });

      if (response.data?.matches?.length > 0) {
        setResults(response.data.matches);
        setSuccessMsg(`Found ${response.data.matches.length} file(s) containing your search terms.`);
      } else {
        setSuccessMsg("No files contain the search terms.");
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      setErrorMsg("Error searching files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setReplacedFiles([]);

    // Send WebSocket message to start replace operation
    sendMessage({
      type: "startReplace",
      payload: { searchPairs, files: results.map((f) => f.path), renameMap, saveAsNew },
    });

    try {
      const response = await axios.post(
        "/api/files/replace",
        {
          searchPairs,
          files: results.map((f) => f.path),
          renameMap,
          saveAsNew,
        },
        { withCredentials: true }
      );

      setSuccessMsg(`✅ Replaced and saved ${response.data.modified.length} file(s).`);
      setReplacedFiles(response.data.modified);
      setResults([]);
    } catch (err) {
      console.error("❌ Replace error:", err);
      setErrorMsg("Replacement failed. Please try again.");
    } finally {
      setLoading(false);
      setConfirmModal(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const updateSearchPair = (index, key, value) => {
    const updated = [...searchPairs];
    updated[index][key] = value;
    setSearchPairs(updated);
  };

  const addSearchPair = () => {
    setSearchPairs([...searchPairs, { search: "", replace: "" }]);
  };

  const removeSearchPair = (index) => {
    const updated = searchPairs.filter((_, i) => i !== index);
    setSearchPairs(updated);
  };

  const updateRenameMap = (filePath, newName) => {
    setRenameMap((prev) => ({ ...prev, [filePath]: newName }));
  };

  return (
    <div className="file-replace-container">
      <h2 className="file-replace-title">🔄 Search & Replace Across Files</h2>

      {errorMsg && <Alert type="error">{errorMsg}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {loading && <Loader className="mb-4" />}

      {/* Dynamic Search/Replace Fields */}
      <div className="search-replace-list">
        {searchPairs.map((pair, idx) => (
          <div key={idx} className="search-replace-row">
            <Input
              placeholder="Search for..."
              value={pair.search}
              onChange={(e) => updateSearchPair(idx, "search", e.target.value)}
            />
            <Input
              placeholder="Replace with..."
              value={pair.replace}
              onChange={(e) => updateSearchPair(idx, "replace", e.target.value)}
            />
            <Button onClick={() => removeSearchPair(idx)} className="bg-red-500 text-white">🗑</Button>
          </div>
        ))}
        <Button onClick={addSearchPair} className="mt-2">➕ Add Another</Button>
      </div>

      {/* Search/Replace Controls */}
      <div className="replace-controls mt-4">
        <Button onClick={handleSearch} disabled={loading}>🔍 Search</Button>
        <Button
          onClick={() => setConfirmModal(true)}
          disabled={results.length === 0}
          className="bg-yellow-500 ml-3"
        >
          ⚠️ Replace In All
        </Button>
        <label className="ml-4 text-sm">
          <input
            type="checkbox"
            checked={saveAsNew}
            onChange={() => setSaveAsNew(!saveAsNew)}
          /> Save as New Files
        </label>
      </div>

      {/* Matched File Preview + Rename */}
      {results.length > 0 && (
        <div className="results-list mt-4">
          <h3 className="text-lg font-semibold mb-2">🔍 Files with Matches</h3>
          {results.map((file, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm text-gray-500">{file.path}</p>
                <p className="mt-2 text-xs text-gray-400">...match found...</p>
                <Input
                  placeholder="Optional new name"
                  value={renameMap[file.path] || ""}
                  onChange={(e) => updateRenameMap(file.path, e.target.value)}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <Modal
          title="⚠️ Confirm Replacement"
          onClose={() => setConfirmModal(false)}
          onConfirm={handleReplace}
          confirmText="Yes, Replace"
        >
          <p>
            This will find & replace across <strong>{results.length}</strong> file(s).
            <br />
            Total replacements: <strong>{searchPairs.length}</strong>
          </p>
          {saveAsNew && <p className="text-sm mt-2">🗂 Files will be saved as new versions.</p>}
        </Modal>
      )}

      {/* Confirmation List */}
      {replacedFiles.length > 0 && (
        <div className="replaced-list mt-6">
          <h3 className="text-lg font-semibold mb-2">✅ Modified Files</h3>
          <ul className="grid gap-2">
            {replacedFiles.map((f, idx) => (
              <li key={idx} className="bg-green-50 p-2 rounded-md text-sm">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileSearchReplace;
