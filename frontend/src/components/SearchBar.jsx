// /Users/patrick/Projects/Teralynk/frontend/src/components/SearchBar.jsx

import React, { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import "../styles/components/SearchBar.css";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form className="search-bar flex items-center gap-2" onSubmit={handleSearch}>
      <Input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search input"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
      />
      <Button type="submit" aria-label="Search button" className="bg-blue-500 hover:bg-blue-600 text-white">
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
