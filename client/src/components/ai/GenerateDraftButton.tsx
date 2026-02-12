import React, { useState } from 'react';
import apiClient from '../../api/axios';
import SearchResults from './SearchResults';

export default function GenerateDraftButton() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai/search', { params: { q: query, k: 5 } });
      setHits(res.data.data || []);
    } catch (err) {
      // errors handled globally by interceptor
    } finally {
      setLoading(false);
    }
  };

  const rebuildIndex = async () => {
    setLoading(true);
    try {
      await apiClient.post('/ai/index');
      // optionally re-run search
      if (query) await runSearch();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search case text..." className="border p-2 flex-1" />
        <button className="btn" onClick={runSearch} disabled={loading || !query}>Search</button>
        <button className="btn" onClick={rebuildIndex} disabled={loading}>Rebuild Index</button>
      </div>
      <div className="mt-3">
        <SearchResults hits={hits} />
      </div>
    </div>
  );
}
