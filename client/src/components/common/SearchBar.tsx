import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchApi, SearchResult } from '../../api/search.api';
import { useAuth } from '../../context/AuthContext';
import { getCaseStateLabel } from '../../utils/caseState';

export const SearchBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchApi.search(query);
        setResults(data);
        setIsOpen(true);
      } catch (e) {
        console.error('Search failed:', e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);

    // Navigate based on user role
    let path = '';
    if (user?.role === 'POLICE') {
      path = `/police/cases/${result.caseId}`;
    } else if (user?.role === 'SHO') {
      path = `/sho/cases/${result.caseId}`;
    } else if (user?.role === 'COURT_CLERK') {
      path = `/court/cases/${result.caseId}`;
    } else if (user?.role === 'JUDGE') {
      path = `/judge/cases/${result.caseId}`;
    }
    
    if (path) {
      navigate(path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by FIR No, Case ID, Accused Name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white placeholder-gray-400"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg
              className="animate-spin h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="py-1">
            {results.map((result) => (
              <button
                key={result.caseId}
                onClick={() => handleResultClick(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {result.firNumber}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getCaseStateLabel(result.caseState)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Case ID: {result.caseId.slice(0, 8)}...
                    </p>
                    {result.accusedNames.length > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        <span className="text-gray-400">Accused:</span>{' '}
                        {result.accusedNames.slice(0, 2).join(', ')}
                        {result.accusedNames.length > 2 && ` +${result.accusedNames.length - 2} more`}
                      </p>
                    )}
                    {result.assignedOfficer && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        <span className="text-gray-400">Officer:</span> {result.assignedOfficer}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 shrink-0">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
          No cases found matching "{query}"
        </div>
      )}
    </div>
  );
};
