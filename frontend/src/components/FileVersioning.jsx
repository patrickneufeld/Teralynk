// File Path: frontend/src/components/FileVersioning.jsx

import React, { useState } from 'react';
import axios from 'axios';

const FileVersioning = () => {
  const [fileId, setFileId] = useState('');
  const [newContent, setNewContent] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateVersion = async () => {
    if (!fileId || !newContent) {
      setMessage('Please provide file ID and new content.');
      return;
    }

    try {
      const response = await axios.post('/api/files/version', { fileId, newContent }, {
        withCredentials: true,
      });
      setMessage('File version created successfully!');
    } catch (error) {
      setMessage('Failed to create file version.');
    }
  };

  return (
    <div className="file-versioning">
      <h2>Create New Version</h2>
      <input
        type="text"
        value={fileId}
        onChange={(e) => setFileId(e.target.value)}
        placeholder="Enter file ID"
      />
      <textarea
        value={newContent}
        onChange={(e) => setNewContent(e.target.value)}
        placeholder="Enter new content for the file"
      ></textarea>
      <button onClick={handleCreateVersion}>Create Version</button>

      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default FileVersioning;
