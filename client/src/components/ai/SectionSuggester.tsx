import React, { useState } from 'react';
import { aiEnhancedApi } from '../../api/aiEnhanced.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Suggestion {
  section: string;
  number: string;
  title: string;
  description: string;
  confidence: number;
  code_type: string;
  punishment?: string;
  explanation?: string;
  equivalent?: {
    section: string;
    title: string;
    number: string;
  };
  matched_keywords?: string[];
}

interface Props {
  incident: string;
  onApplySection?: (sectionText: string) => void;
}

export const SectionSuggester: React.FC<Props> = ({ incident, onApplySection }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[SectionSuggester] Calling with incident:', incident);
      const res = await aiEnhancedApi.suggestSections(incident, 5, 'both');
      console.log('[SectionSuggester] Full response:', res);
      
      const sects = res?.suggestions || [];
      console.log('[SectionSuggester] Extracted suggestions:', sects);
      setSuggestions(sects);
      
      if (sects.length === 0) {
        setError('No suggestions found. Make sure the AI service is running on port 8001.');
      }
    } catch (e: any) {
      console.error('[SectionSuggester] Error:', e);
      setError(e?.message || 'Suggestion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestion: Suggestion) => {
    if (onApplySection) {
      onApplySection(suggestion.section);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">🎯 AI Section Suggestions</h3>
        <Button onClick={runSuggest} disabled={loading} variant="secondary" size="sm">
          {loading ? '🔍 Analyzing...' : '🔍 Get Suggestions'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* Header with Section Number and Action Button */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-700 text-lg">{s.section}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                      {Math.round(s.confidence * 100)}% match
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800">{s.title}</h4>
                </div>
                {onApplySection && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleApply(s)}
                    className="text-xs whitespace-nowrap px-3 py-1"
                  >
                    ✓ Use This
                  </Button>
                )}
              </div>

              {/* IPC ↔ BNS Comparison Box */}
              {s.equivalent && (
                <div className="mb-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded">
                  <p className="text-xs font-semibold text-purple-700 mb-1">
                    {s.code_type === 'IPC' ? '🔄 New BNS Equivalent:' : '🔄 Old IPC Equivalent:'}
                  </p>
                  <p className="text-xs text-purple-900">
                    <span className="font-bold">{s.equivalent.section}</span> - {s.equivalent.title}
                  </p>
                </div>
              )}

              {/* Why This Section? Explanation */}
              {s.explanation && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-900">
                    <span className="font-semibold">💡 Why suggested:</span> {s.explanation}
                  </p>
                </div>
              )}

              {/* Section Description */}
              <p className="text-xs text-gray-600 mb-2 leading-relaxed">{s.description}</p>

              {/* Punishment Information */}
              {s.punishment && (
                <div className="flex items-center gap-2 text-xs pt-2 border-t border-gray-100">
                  <span className="text-gray-500">⚖️ Punishment:</span>
                  <span className="text-gray-700 font-medium">{s.punishment}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default SectionSuggester;
