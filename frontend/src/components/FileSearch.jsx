// File Path: frontend/src/components/FileSearch.jsx

import React, { useState } from 'react';
import axios from 'axios';

const FileSearch = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/files/search', {
        params: { query },
        withCredentials: true,
      });
      setSearchResults(response.data.searchResults);
    } catch (err) {
      setError('Failed to search files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-search">
      <h2>Search Files</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a file..."
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>

      {error && <div className="error">{error}</div>}

      {searchResults.length > 0 && (
        <ul>
          {searchResults.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileSearch;
