import { useState } from "react";

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  // console.log("SearchBar rendered with query:", query);
  const handleChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    // Debounce: only call onSearch after user stops typing for 300ms
    if (SearchBar.debounceTimeout) clearTimeout(SearchBar.debounceTimeout);
    SearchBar.debounceTimeout = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search inventory..."
      className="p-2 border rounded w-1/2 dark:bg-gray-700 dark:text-white"
    />
  );
};

export default SearchBar;
