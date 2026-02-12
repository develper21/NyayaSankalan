import React, { useState } from 'react';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

type Props = { text: string };

export const LegalEntityExtractor: React.FC<Props> = ({ text }) => {
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiEnhancedApi.legalNer(text);
      console.log('[LegalEntityExtractor] Full response:', res);
      const ents = res?.entities || res?.data?.entities || res;
      setEntities(ents);
      if (!ents || Object.keys(ents).length === 0) {
        console.warn('[LegalEntityExtractor] No entities found');
      }
    } catch (e: any) {
      console.error('[LegalEntityExtractor] Error:', e);
      setError(e?.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI: Legal Entity Extraction</h3>
        <Button onClick={extract} disabled={loading}>
          {loading ? 'Extracting…' : 'Extract Entities'}
        </Button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {entities && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <h4 className="font-medium">IPC Sections</h4>
            <ul className="list-disc pl-5">
              {(entities.ipc_sections || []).map((s: any, i: number) => (
                <li key={i}>{s.section} {s.title ? `- ${s.title}` : ''}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Courts</h4>
            <ul className="list-disc pl-5">
              {(entities.court_names || []).map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default LegalEntityExtractor;
