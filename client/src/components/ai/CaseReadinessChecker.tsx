import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/ai.api';
import { caseApi } from '../../api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Case } from '../../types/api.types';

interface ReadinessResult {
  readinessScore: number;
  status: string;
  blockers: string[];
  recommendations: string[];
  checkedAt: string;
  id: string;
}

interface Props {
  caseId?: string;
  onSuccess?: (result: ReadinessResult) => void;
}

export const CaseReadinessChecker: React.FC<Props> = ({ caseId: propCaseId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [caseId, setCaseId] = useState(propCaseId || '');
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [caseType, setCaseType] = useState('GENERAL');

  useEffect(() => {
    if (!propCaseId) {
      fetchCases();
    }
  }, [propCaseId]);

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      const data = await caseApi.getAllCases();
      setCases(data);
    } catch {
      toast.error('Failed to load cases');
    } finally {
      setLoadingCases(false);
    }
  };

  const checkReadiness = async () => {
    if (!caseId) {
      toast.error('Case ID is required');
      return;
    }

    setLoading(true);
    try {
      const response = await aiApi.checkCaseReadiness(caseId, {
        caseType,
        witnessCount: 0,
        evidenceCount: 0,
        timelineInfo: { daysElapsed: 0, expectedDays: 90 },
      });

      // Backend returns {success: true, data: {...}}
      const readinessData = response.data.data as ReadinessResult;
      setResult(readinessData);
      toast.success('Case readiness checked successfully');
      onSuccess?.(readinessData);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = error.response?.data?.message || error.message || 'Failed to check case readiness';
      toast.error(errorMsg);
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusBadge = (status: string): 'success' | 'danger' | 'warning' | 'default' => {
    const colors: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
      READY: 'success',
      'NOT_READY': 'danger',
      PENDING: 'warning',
    };
    return colors[status] || 'default';
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            ✅ Case Readiness Checker
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Evaluate if a case is ready for prosecution with AI-powered analysis
          </p>
        </div>

        {/* Input Form */}
        {!result && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              {!propCaseId && (
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Case <span className="text-red-500">*</span>
                  </label>
                  {loadingCases ? (
                    <div className="text-sm text-gray-500">Loading cases...</div>
                  ) : (
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">-- Select a case --</option>
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fir?.firNumber || `Case ${c.id.slice(0, 8)}`} - {c.fir?.sectionsApplied || 'N/A'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Case Type
                </label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="GENERAL">General</option>
                  <option value="CRIMINAL">Criminal</option>
                  <option value="CIVIL">Civil</option>
                  <option value="MURDER">Murder</option>
                  <option value="THEFT">Theft</option>
                  <option value="ASSAULT">Assault</option>
                  <option value="ROBBERY">Robbery</option>
                  <option value="FRAUD">Fraud</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ The system will automatically analyze:
              </p>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Documents uploaded to this case</li>
                <li>• Number of witnesses recorded</li>
                <li>• Evidence items collected</li>
                <li>• Days elapsed since FIR registration</li>
              </ul>
            </div>

            <Button
              onClick={checkReadiness}
              isLoading={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '🔍 Analyzing...' : '🔍 Check Readiness'}
            </Button>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {/* Score */}
            <div className={`p-6 rounded-lg ${getScoreColor(result.readinessScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Readiness Score</span>
                <Badge variant={getStatusBadge(result.status)}>{result.status}</Badge>
              </div>
              <div className="text-4xl font-bold mb-2">{result.readinessScore.toFixed(1)}%</div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(result.readinessScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Blockers */}
            {result.blockers.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Blockers</h3>
                <ul className="space-y-1">
                  {result.blockers.map((blocker, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      • {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Recommendations</h3>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 flex justify-between pt-2">
              <span>Check ID: {result.id.substring(0, 8)}...</span>
              <span>Checked: {new Date(result.checkedAt).toLocaleDateString()}</span>
            </div>

            <Button
              onClick={() => setResult(null)}
              variant="secondary"
              className="w-full"
            >
              ← Check Another Case
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CaseReadinessChecker;
