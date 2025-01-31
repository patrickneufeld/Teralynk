import React, { useState } from 'react';
import axios from 'axios';

const FileSearchReplace = () => {
  const [query, setQuery] = useState(''); // Search query
  const [replaceText, setReplaceText] = useState(''); // Replacement text
  const [fileId, setFileId] = useState(''); // File ID to apply changes
  const [message, setMessage] = useState(''); // Feedback message
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state
  const [updatedFileContent, setUpdatedFileContent] = useState(''); // Updated content after replacement

  // Handle search and replace action
  const handleSearchReplace = async () => {
    if (!query || !replaceText || !fileId) {
      setMessage('Please provide file ID, search query, and replace text.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Send request to search and replace content in the file
      const response = await axios.post('/api/files/search-replace', {
        fileId,
        query,
        replaceText,
      }, { withCredentials: true });

      setUpdatedFileContent(response.data.updatedContent);
      setMessage('File content updated successfully!');
    } catch (err) {
      setError('Failed to perform search and replace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-search-replace">
      <h2>Search and Replace Content in File</h2>

      {/* File ID Input */}
      <input
        type="text"
        value={fileId}
        onChange={(e) => setFileId(e.target.value)}
        placeholder="Enter file ID"
      />

      {/* Search Query Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for..."
      />

      {/* Replace Text Input */}
      <input
        type="text"
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        placeholder="Replace with..."
      />

      {/* Action Button */}
      <button onClick={handleSearchReplace} disabled={loading}>
        {loading ? 'Processing...' : 'Search & Replace'}
      </button>

      {/* Display Messages */}
      {message && <div className="message">{message}</div>}
      {error && <div className="error">{error}</div>}

      {/* Display Updated Content */}
      {updatedFileContent && (
        <div className="updated-content">
          <h3>Updated Content:</h3>
          <textarea readOnly value={updatedFileContent} />
        </div>
      )}
    </div>
  );
};

export default FileSearchReplace;
