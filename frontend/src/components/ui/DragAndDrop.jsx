// File: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/DragAndDrop.jsx

import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import "../../styles/components/DragAndDrop.css";

export default function DragAndDrop({ onFilesDropped }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (onFilesDropped) onFilesDropped(files);
  }, [onFilesDropped]);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`drag-drop-zone ${isDragging ? "drag-over" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <p>📂 Drag & drop files here, or click to select.</p>
      <input
        type="file"
        multiple
        onChange={(e) => onFilesDropped(Array.from(e.target.files))}
        className="file-input"
        aria-label="Upload files"
      />
    </div>
  );
}

DragAndDrop.propTypes = {
  onFilesDropped: PropTypes.func.isRequired,
};
