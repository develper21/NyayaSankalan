import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import toast from 'react-hot-toast';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';

interface PrecedentItem {
  title?: string;
  case_name?: string;
  summary?: string;
}

interface Props {
  defaultText?: string;
  title?: string;
}

export const AIInsightPane: React.FC<Props> = ({ defaultText = '', title = 'AI Insights' }) => {
  const [text, setText] = useState(defaultText);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [precedents, setPrecedents] = useState<PrecedentItem[]>([]);
  const [loading, setLoading] = useState<{ keywords: boolean; sections: boolean; precedents: boolean }>({
    keywords: false,
    sections: false,
    precedents: false,
  });

  const ensureText = () => {
    if (!text.trim()) {
      toast.error('Add some case text first');
      return false;
    }
    return true;
  };

  const handleKeywords = async () => {
    if (!ensureText()) return;
    setLoading((s) => ({ ...s, keywords: true }));
    try {
      const res = await aiEnhancedApi.suggestKeywords(text, 10);
      setKeywords(Array.isArray(res?.keywords) ? res.keywords : Array.isArray(res) ? res : []);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Keyword suggestion failed';
      toast.error(message);
    } finally {
      setLoading((s) => ({ ...s, keywords: false }));
    }
  };

  const handleSections = async () => {
    if (!ensureText()) return;
    setLoading((s) => ({ ...s, sections: true }));
    try {
      const res = await aiEnhancedApi.suggestSections(text, 5, 'both');
      const list = res?.sections || res || [];
      const normalized = Array.isArray(list)
        ? list
            .map((s: string | { section?: string }) => (typeof s === 'string' ? s : s?.section))
            .filter((v): v is string => Boolean(v))
        : [];
      setSections(normalized);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Section suggestion failed';
      toast.error(message);
    } finally {
      setLoading((s) => ({ ...s, sections: false }));
    }
  };

  const handlePrecedents = async () => {
    if (!ensureText()) return;
    setLoading((s) => ({ ...s, precedents: true }));
    try {
      const res = await aiEnhancedApi.findPrecedents(text, 5);
      const list = res?.precedents || res?.data || res || [];
      setPrecedents(Array.isArray(list) ? (list as PrecedentItem[]) : []);
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Precedent search failed';
      toast.error(message);
    } finally {
      setLoading((s) => ({ ...s, precedents: false }));
    }
  };

  return (
    <Card title={title}>
      <div className="space-y-3">
        <Textarea
          label="Case context"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste facts, notes, or FIR details to get AI insights"
          rows={5}
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={handleKeywords} isLoading={loading.keywords}>
            Suggest Keywords
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSections} isLoading={loading.sections}>
            Suggest Sections (IPC/BNS)
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrecedents} isLoading={loading.precedents}>
            Find Precedents
          </Button>
        </div>

        {keywords.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold">Suggested Keywords</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <Badge key={k} variant="info">{k}</Badge>
              ))}
            </div>
          </div>
        )}

        {sections.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold">Suggested Sections</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <Badge key={s} variant="warning">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {precedents.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Precedents</p>
            <div className="space-y-2">
              {precedents.map((p, idx) => (
                <div key={idx} className="border rounded p-2 bg-gray-50">
                  <p className="font-medium text-sm">{p?.title || p?.case_name || 'Precedent'}</p>
                  {p?.summary && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{p.summary}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
