// File: /Users/patrick/Projects/Teralynk/frontend/src/components/ui/FileList.jsx

import React from "react";
import PropTypes from "prop-types";
import "../../styles/components/FileList.css";

export default function FileList({ files }) {
  return (
    <div className="file-list">
      <h4 className="file-list-header">📁 Files</h4>
      {files.length === 0 ? (
        <p className="empty-file-list">No files stored in this platform.</p>
      ) : (
        <ul>
          {files.map((file, idx) => (
            <li key={idx} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              <span className="file-date">{new Date(file.uploadedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

FileList.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      size: PropTypes.number,
      uploadedAt: PropTypes.string,
    })
  ).isRequired,
};
