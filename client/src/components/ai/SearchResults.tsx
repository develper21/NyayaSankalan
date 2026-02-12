import React from 'react';

type Hit = {
  id: string;
  caseId?: string;
  sourceFile?: string;
  snippet?: string;
  score?: number;
};

export default function SearchResults({ hits }: { hits: Hit[] }) {
  if (!hits || hits.length === 0) return <div>No results</div>;
  return (
    <div className="bg-white rounded shadow p-3">
      {hits.map((h) => (
        <div key={h.id} className="border-b py-2">
          <div className="text-sm text-gray-700">Case: {h.caseId || '—'}</div>
          <div className="text-sm font-semibold">{h.sourceFile}</div>
          <div className="text-xs text-gray-600 mt-1">{h.snippet}</div>
          <div className="text-xs text-gray-500 mt-1">Score: {h.score?.toFixed(3)}</div>
        </div>
      ))}
    </div>
  );
}
