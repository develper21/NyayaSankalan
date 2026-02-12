import React, { useState } from 'react';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Precedent {
  case_id: string;
  title: string;
  sections: string[];
  court: string;
  year: number;
  description: string;
  similarity: number;
  citation?: string;
  file_path?: string;
}

interface Props {
  caseDescription: string;
  sections?: string;
}

export const PrecedentMatcher: React.FC<Props> = ({ caseDescription, sections }) => {
  const [loading, setLoading] = useState(false);
  const [precedents, setPrecedents] = useState<Precedent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(caseDescription || '');
  const [filterSection, setFilterSection] = useState(sections || '');

  const findPrecedents = async () => {
    if (!query.trim()) {
      setError('Please enter a case description or query');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[PrecedentMatcher] Searching with query:', query);
      const res = await aiEnhancedApi.findPrecedents(
        query,
        5,
        filterSection || undefined
      );
      console.log('[PrecedentMatcher] Full response:', res);
      
      const cases = res?.similar_cases || res?.data?.similar_cases || res?.precedents || res?.cases || [];
      console.log('[PrecedentMatcher] Extracted precedents:', cases);
      setPrecedents(cases);
      
      if (cases.length === 0) {
        setError('No similar cases found. Try different keywords or remove section filter.');
      }
    } catch (e: unknown) {
      console.error('[PrecedentMatcher] Error:', e);
      setError('Failed to find precedents');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">🔍 Find Similar Cases (Precedent Matcher)</h3>
          <p className="text-sm text-gray-600">
            AI-powered semantic search to find similar past cases and legal precedents
          </p>
        </div>

        {/* Search Inputs */}
        <div className="space-y-3">
          <Input
            label="Search Query (Case Description/Facts)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., murder case with multiple witnesses"
          />
          
          <Input
            label="Filter by Section (Optional)"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            placeholder="e.g., 302, 307"
          />

          <Button
            onClick={findPrecedents}
            isLoading={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? '🔍 Searching precedents...' : '🔍 Find Similar Cases'}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {precedents.length > 0 && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-semibold">
                ✓ Found {precedents.length} similar case{precedents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {precedents.map((p, idx) => (
              <div
                key={idx}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-base mb-1">
                      {p.title || `Case ${p.case_id?.substring(0, 8) || idx + 1}`}
                    </h4>
                    {p.citation && (
                      <p className="text-xs text-gray-500 font-mono">{p.citation}</p>
                    )}
                  </div>
                  <div className="ml-3">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {Math.round(p.similarity * 100)}% match
                    </span>
                  </div>
                </div>

                {/* Court & Year */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  {p.court && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">🏛️ Court:</span>
                      <span className="text-gray-700 font-medium">{p.court}</span>
                    </div>
                  )}
                  {p.year && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">📅 Year:</span>
                      <span className="text-gray-700 font-medium">{p.year}</span>
                    </div>
                  )}
                </div>

                {/* Sections */}
                {p.sections && p.sections.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Sections Applied:</p>
                    <div className="flex flex-wrap gap-2">
                      {p.sections.map((sec, sidx) => (
                        <span
                          key={sidx}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {p.description && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PrecedentMatcher;
