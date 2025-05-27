// ✅ FILE: /frontend/src/components/dialogs/MetadataDialog.jsx

import React, { useState } from "react";

const MetadataDialog = ({ open, fileId, onClose, onSave }) => {
  const [metadata, setMetadata] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (onSave) onSave(metadata);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4">Metadata</h2>
        <div className="mb-4">
          <p className="text-lg font-medium">File ID: {fileId}</p>
          <textarea
            className="w-full p-2 border rounded-md"
            rows={5}
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataDialog;
