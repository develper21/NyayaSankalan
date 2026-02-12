import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import apiClient from '../../api/axios';
import toast from 'react-hot-toast';

interface SearchResult {
  caseId?: string;
  score?: number;
  sourceFile?: string;
  snippet?: string;
}

export const AISearchWidget: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [limit, setLimit] = useState<number>(5);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const response = await apiClient.get('/ai/search', {
        params: { q: query, k: limit },
      });

      const payload =
        response.data?.results ||
        response.data?.data?.results ||
        response.data?.data ||
        response.data;

      setResults(Array.isArray(payload) ? payload : []);
    } catch (err: unknown) {
      type WithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === 'object' && err !== null
          ? (err as WithResponse).response?.data?.message || (err as Error).message
          : 'Search failed';
      toast.error(message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);

    try {
      const response = await apiClient.post('/ai/index');
      const indexed = response.data?.data?.indexed || response.data?.indexed || 0;
      toast.success(`AI knowledge index rebuilt with ${indexed} documents`);
    } catch (err: unknown) {
      type WithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === 'object' && err !== null
          ? (err as WithResponse).response?.data?.message || (err as Error).message
          : 'Index rebuild failed';
      toast.error(message || 'Index rebuild failed');
    } finally {
      setIsRebuilding(false);
    }
  };

  const extractSections = (snippet?: string) => {
    if (!snippet) return [] as string[];
    const matches = snippet.match(/IPC\s*\d+/gi);
    if (!matches) return [] as string[];
    const uniq = Array.from(new Set(matches.map(m => m.trim().toUpperCase())));
    return uniq.slice(0, 6);
  };

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🔍 AI Case Similarity & Knowledge Search
          <Badge variant="info">
            Insight Assist — Read-only, does not modify case records
          </Badge>
        </h3>
      </div>

      <div className="p-4 space-y-4">

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              label="Search query"
              placeholder="Search using IPC sections, entities, case details or keywords…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              wrapperClassName="mb-0"
            />
          </div>

          <div className="w-32">
            <Select
              label="Results"
              value={String(limit)}
              onChange={(e) => setLimit(Number(e.target.value))}
              options={[
                { value: '3', label: '3' },
                { value: '5', label: '5' },
                { value: '8', label: '8' },
                { value: '10', label: '10' },
              ]}
              wrapperClassName="mb-0"
            />
          </div>

          <div className="self-end">
            <Button variant="primary" onClick={handleSearch} isLoading={isLoading}>
              {isLoading ? '🔍 Searching…' : '🔍 Search'}
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleRebuildIndex}
              isLoading={isRebuilding}
              size="sm"
            >
              {isRebuilding
                ? '🔄 Rebuilding knowledge index…'
                : '🔄 Update AI Knowledge Index'}
            </Button>

            <span className="text-xs text-gray-500">
              Rebuilds the AI knowledge index using previously extracted case documents.
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {results.length === 0 && !isLoading && (
            <p className="text-sm text-gray-500">
              No matching records were found in the AI knowledge index.
              Try searching using an IPC section, accused name, location, or case description.
            </p>
          )}

          {results.map((r, idx) => (
            <div key={`${r.caseId}-${idx}`} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">

                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">
                      Case: {r.caseId || 'Unknown'}
                    </p>

                    {extractSections(r.snippet).map(sec => (
                      <span
                        key={sec}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    Source: {r.sourceFile || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="info">
                    Similarity Score {(r.score ?? 0).toFixed(3)}
                  </Badge>

                  {r.caseId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        window.location.assign(`/sho/cases/${r.caseId}`)
                      }
                    >
                      Open Case
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                {r.snippet || 'No preview text available'}
              </p>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mt-3">
          Provides reference insights using the AI knowledge index.
          Does not modify case workflows, records, or system data.
        </div>
      </div>
    </div>
  );
};
