import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/ai.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface CaseBriefSection {
  title: string;
  content: string;
}

interface BriefResult {
  sections: CaseBriefSection[];
  generatedAt: string;
  id: string;
}

interface Props {
  caseId: string;
  onSuccess?: (result: BriefResult) => void;
}

export const CaseBriefViewer: React.FC<Props> = ({ caseId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BriefResult | null>(null);
  const [caseNumber, setCaseNumber] = useState('');
  const [caseType, setCaseType] = useState('CRIMINAL');
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const generateBrief = async () => {
    if (!caseId || !caseNumber) {
      toast.error('Case ID and Case Number are required');
      return;
    }

    setLoading(true);
    try {
      const response = await aiApi.generateCaseBrief(caseId, {
        caseNumber,
        caseType,
      });

      const briefData = response.data as BriefResult;
      setResult(briefData);
      toast.success('Case brief generated successfully');
      onSuccess?.(briefData);
    } catch (err) {
      toast.error('Failed to generate case brief');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sectionIcons: Record<string, string> = {
    overview: '📋',
    parties: '👥',
    facts: '📖',
    charges: '⚖️',
    evidence: '🔍',
    precedents: '📚',
    arguments: '💬',
    timeline: '⏰',
    legal: '⚖️',
    issues: '❓',
    recommendations: '💡',
    conclusion: '✅',
  };

  const getSectionIcon = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    for (const [key, icon] of Object.entries(sectionIcons)) {
      if (lowerTitle.includes(key)) return icon;
    }
    return '📄';
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📑 Case Brief Generator
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Generate comprehensive AI-powered case briefs with all legal details
          </p>
        </div>

        {/* Input Form */}
        {!result && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Case Number
                </label>
                <Input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g., FIR/2025/0001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Case Type
                </label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="CRIMINAL">Criminal</option>
                  <option value="CIVIL">Civil</option>
                  <option value="MURDER">Murder</option>
                  <option value="THEFT">Theft</option>
                  <option value="FRAUD">Fraud</option>
                </select>
              </div>
            </div>

            <Button
              onClick={generateBrief}
              isLoading={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '⏳ Generating Brief...' : '✍️ Generate Brief'}
            </Button>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-3">
            {/* Info Bar */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <span className="text-sm text-blue-900">
                <strong>{result.sections.length}</strong> sections in this brief
              </span>
              <Badge variant="success">
                {new Date(result.generatedAt).toLocaleDateString()}
              </Badge>
            </div>

            {/* Sections */}
            <div className="space-y-2">
              {result.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Section Header (Collapsible) */}
                  <button
                    onClick={() =>
                      setExpandedSection(expandedSection === idx ? null : idx)
                    }
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-lg">{getSectionIcon(section.title)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {section.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {section.content.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xl text-gray-600 transition-transform ${
                        expandedSection === idx ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Section Content */}
                  {expandedSection === idx && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-white max-h-96 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        {section.content.split('\n').map((line, lineIdx) => (
                          <p key={lineIdx} className="text-sm text-gray-700 mb-2">
                            {line || <br />}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => {
                  const text = result.sections
                    .map((s) => `## ${s.title}\n\n${s.content}`)
                    .join('\n\n---\n\n');
                  navigator.clipboard.writeText(text);
                  toast.success('Brief copied to clipboard');
                }}
                variant="secondary"
                className="text-sm"
              >
                📋 Copy Brief
              </Button>

              <Button
                onClick={() => {
                  const doc = `CASE BRIEF\n\nGenerated: ${new Date(result.generatedAt).toLocaleString()}\n\n${result.sections
                    .map((s) => `${s.title}\n${'-'.repeat(s.title.length)}\n${s.content}`)
                    .join('\n\n')}`;
                  const element = document.createElement('a');
                  element.setAttribute(
                    'href',
                    'data:text/plain;charset=utf-8,' + encodeURIComponent(doc)
                  );
                  element.setAttribute('download', `case-brief-${result.id}.txt`);
                  element.style.display = 'none';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                  toast.success('Brief downloaded');
                }}
                variant="secondary"
                className="text-sm"
              >
                📥 Download
              </Button>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 flex justify-between pt-2 border-t border-gray-200">
              <span>Brief ID: {result.id.substring(0, 8)}...</span>
              <span>Generated: {new Date(result.generatedAt).toLocaleTimeString()}</span>
            </div>

            <Button
              onClick={() => setResult(null)}
              variant="secondary"
              className="w-full"
            >
              ← Generate Another Brief
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CaseBriefViewer;
