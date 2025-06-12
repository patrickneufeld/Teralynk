// ✅ FILE: /frontend/src/components/modals/FilePreviewModal.jsx

import React from "react";

const FilePreviewModal = ({ open, file, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-lg max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4">File Preview</h2>
        <div className="mb-4">
          <p className="text-lg font-medium">File: {file.name}</p>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {file.textContent || "No content to preview."}
          </pre>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
