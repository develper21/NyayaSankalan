import React, { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../../api/axios';
import { Link } from 'react-router-dom';
import debounce from '../../utils/debounce';

interface SearchResult {
  id?: string;
  caseId?: string;
  score?: number;
  sourceFile?: string;
  text?: string;
  snippet?: string;
  metadata?: {
    id?: string;
    caseId?: string;
    sourceFile?: string;
  };
}

interface Props {
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
}

// Extract IPC sections from text
const extractIPCSections = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(/IPC\s*\d+[A-Z]?/gi) || [];
  return [...new Set(matches.map((m) => m.toUpperCase()))].slice(0, 6);
};

export const AISearchRecommendations: React.FC<Props> = ({
  placeholder = 'Search cases, IPC sections, names...',
  onResultClick,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [relatedSections, setRelatedSections] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const searchAPI = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) {
        setResults([]);
        setRelatedSections([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.get('/ai/search', {
          params: { q, k: 5 },
        });

        const data =
          response.data?.data?.results ||
          response.data?.data ||
          response.data?.results ||
          response.data ||
          [];

        const resultsArray = Array.isArray(data) ? data : [];
        setResults(resultsArray);

        // Extract IPC sections from all results
        const allSections: string[] = [];
        resultsArray.forEach((r: SearchResult) => {
          const text = r.text || r.snippet || '';
          allSections.push(...extractIPCSections(text));
        });
        setRelatedSections([...new Set(allSections)].slice(0, 8));

        setShowDropdown(true);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchAPI(value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setShowDropdown(false);
  };

  const handleSectionClick = (section: string) => {
    setQuery(section);
    searchAPI(section);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        {loading && (
          <span className="absolute right-3 top-2.5 text-gray-400 animate-spin">⏳</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (query.length >= 2) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Related IPC Sections */}
          {relatedSections.length > 0 && (
            <div className="p-3 border-b bg-blue-50">
              <div className="text-xs text-gray-500 mb-2">📜 Related IPC Sections</div>
              <div className="flex flex-wrap gap-2">
                {relatedSections.map((section) => (
                  <button
                    key={section}
                    onClick={() => handleSectionClick(section)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 ? (
            <div>
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                🔎 Similar Cases ({results.length} found)
              </div>
              {results.map((result, idx) => {
                const caseId = result.caseId || result.metadata?.caseId || result.id;
                const sourceFile = result.sourceFile || result.metadata?.sourceFile || 'Unknown';
                const snippet = result.text || result.snippet || '';
                const score = result.score ?? 0;

                return (
                  <div
                    key={`${caseId}-${idx}`}
                    onClick={() => handleResultClick(result)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-800 truncate">
                            Case: {caseId?.slice(0, 8) || 'N/A'}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            {(score * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-1">
                          📄 {sourceFile}
                        </div>
                        {snippet && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {snippet.slice(0, 150)}...
                          </p>
                        )}
                      </div>
                      {caseId && (
                        <Link
                          to={`/sho/cases/${caseId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <span className="block text-2xl mb-1">🔍</span>
              No matching cases found
            </div>
          ) : null}

          {/* Did you mean suggestion */}
          {query.length >= 3 && results.length === 0 && !loading && (
            <div className="p-3 bg-yellow-50 border-t text-sm">
              <span className="text-yellow-700">💡 Did you mean: </span>
              <button
                onClick={() => handleSectionClick('IPC 302')}
                className="text-blue-600 hover:underline mr-2"
              >
                IPC 302
              </button>
              <button
                onClick={() => handleSectionClick('theft')}
                className="text-blue-600 hover:underline mr-2"
              >
                theft
              </button>
              <button
                onClick={() => handleSectionClick('robbery')}
                className="text-blue-600 hover:underline"
              >
                robbery
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
