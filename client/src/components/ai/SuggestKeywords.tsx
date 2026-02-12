import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Loader } from '../common/Loader';

interface SuggestKeywordsProps {
  text: string;
  title?: string;
}

interface KeywordResponse {
  keywords: string[];
  sections: string[];
  context: string[];
}

const SuggestKeywords: React.FC<SuggestKeywordsProps> = ({ text, title = 'Suggested Search Keywords' }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordResponse>({ keywords: [], sections: [], context: [] });

  useEffect(() => {
    if (!text || text.trim().length < 10) return;
    fetchKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const res = await aiEnhancedApi.suggestKeywords(text, 8);
      setData({
        keywords: res?.keywords || [],
        sections: res?.sections || [],
        context: res?.context || [],
      });
    } catch {
      toast.error('Failed to fetch keywords');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    const parts = [...data.keywords, ...data.sections, ...data.context].filter(Boolean);
    if (!parts.length) {
      toast.error('No keywords to copy');
      return;
    }
    await navigator.clipboard.writeText(parts.join(', '));
    toast.success('Keywords copied');
  };

  const renderGroup = (label: string, values: string[]) => (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.length ? values.map((item, idx) => (
          <Badge key={`${label}-${item}-${idx}`} variant="info">{item}</Badge>
        )) : (
          <span className="text-xs text-gray-500">No suggestions</span>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">Auto-extracted keywords, sections, and context to speed up search.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={fetchKeywords} disabled={loading}>Refresh</Button>
          <Button variant="secondary" onClick={copyAll} disabled={loading}>Copy all</Button>
        </div>
      </div>

      {loading ? (
        <div className="py-4">
          <Loader text="Fetching suggestions..." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {renderGroup('Keywords', data.keywords)}
          {renderGroup('Sections', data.sections)}
          {renderGroup('Context', data.context)}
        </div>
      )}
    </Card>
  );
};

export default SuggestKeywords;
