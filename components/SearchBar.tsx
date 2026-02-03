import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useRouter } from 'next/router';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  debounceMs?: number;
  fullWidth?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search articles, topics...',
  className = '',
  showSuggestions = false,
  suggestions = [],
  onSuggestionClick,
  debounceMs = 300,
  fullWidth = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (onSearch) {
      debounceRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  useEffect(() => {
    if (showSuggestions && query) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setIsOpen(false);
      setFilteredSuggestions([]);
    }
  }, [query, suggestions, showSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveSuggestion(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const suggestion = filteredSuggestions[activeSuggestion];
          if (suggestion) {
            setQuery(suggestion);
            onSuggestionClick?.(suggestion);
            setIsOpen(false);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveSuggestion(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSuggestionClick?.(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'w-full max-w-2xl'} ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400 group-focus-within:text-golden transition-colors" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(filteredSuggestions.length > 0)}
            placeholder={placeholder}
            className="block w-full pl-12 pr-32 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-golden focus:ring-2 focus:ring-golden/20 transition-all duration-300 text-base shadow-sm hover:shadow-md text-center"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                <FiX className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              className="bg-golden hover:bg-yellow-400 text-navy px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              Search
            </button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && filteredSuggestions.length > 0 && (
          <ul className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-80 overflow-hidden focus:outline-none">
            <div className="max-h-80 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`
                    cursor-pointer select-none relative py-3 pl-4 pr-12 border-b border-gray-100 last:border-b-0 transition-colors duration-200
                    ${index === activeSuggestion
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <FiSearch className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                    <span className="block truncate font-medium">{suggestion}</span>
                  </div>
                  {index === activeSuggestion && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <div className="bg-blue-600 text-white rounded-full p-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </span>
                  )}
                </li>
              ))}
            </div>
          </ul>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
