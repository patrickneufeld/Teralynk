// File Path: frontend/components/SearchBar.jsx

import React, { useState } from 'react';
import '../styles/SearchBar.css'; // Updated path to align with the styles directory

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (onSearch && query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form className="search-bar" onSubmit={handleSearch}>
            <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search input"
            />
            <button type="submit" aria-label="Search">
                Search
            </button>
        </form>
    );
};

export default SearchBar;
