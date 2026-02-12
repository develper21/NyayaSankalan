import React from 'react';
import GenerateDraftButton from '../../components/ai/GenerateDraftButton';

export default function AIDemoPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">AI Features — Demo (Preview only)</h1>
      <p className="mb-4 text-sm text-gray-600">This is an isolated preview page for the AI PoC. Actions are preview-only and do not write to the production database. Use this page to try search and draft generation.</p>

      <div className="bg-gray-50 p-4 rounded">
        <GenerateDraftButton />
      </div>
    </div>
  );
}
