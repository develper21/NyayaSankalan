import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/ai.api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface ValidationResult {
  valid: boolean;
  complianceScore: number;
  fieldsPresent: string[];
  fieldsMissing: string[];
  signaturesPresent: string[];
  signaturesMissing: string[];
  errors: string[];
  warnings: string[];
  validatedAt: string;
  id: string;
}

interface Props {
  caseId: string;
  onSuccess?: (result: ValidationResult) => void;
}

export const DocumentValidator: React.FC<Props> = ({ caseId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [documentType, setDocumentType] = useState('FIR');
  const [documentName, setDocumentName] = useState('');

  const validateDocument = async () => {
    if (!caseId || !documentName) {
      toast.error('Case ID and Document Name are required');
      return;
    }

    setLoading(true);
    try {
      const response = await aiApi.validateDocument(caseId, {
        documentType,
        documentName,
      });

      const validationData = response.data as ValidationResult;
      setResult(validationData);
      toast.success(validationData.valid ? '✅ Document is valid' : '⚠️ Document has issues');
      onSuccess?.(validationData);
    } catch (err) {
      toast.error('Failed to validate document');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 Document Validator
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Verify document compliance and completeness using AI analysis
          </p>
        </div>

        {/* Input Form */}
        {!result && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="FIR">FIR (First Information Report)</option>
                  <option value="CHARGE_SHEET">Charge Sheet</option>
                  <option value="STATEMENT">Statement</option>
                  <option value="EVIDENCE">Evidence Listing</option>
                  <option value="BAIL_APPLICATION">Bail Application</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Name
                </label>
                <Input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., FIR_2025_0001.pdf"
                />
              </div>
            </div>

            <Button
              onClick={validateDocument}
              isLoading={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '🔍 Validating...' : '🔍 Validate Document'}
            </Button>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {/* Validity Status */}
            <div
              className={`p-6 rounded-lg ${
                result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Document Status</span>
                <Badge variant={result.valid ? 'success' : 'danger'}>
                  {result.valid ? 'VALID' : 'INVALID'}
                </Badge>
              </div>
              <p className={result.valid ? 'text-green-700' : 'text-red-700'}>
                {result.valid
                  ? '✅ Document meets all compliance requirements'
                  : '❌ Document has compliance issues'}
              </p>
            </div>

            {/* Compliance Score */}
            <div className={`p-4 rounded-lg ${getComplianceColor(result.complianceScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Compliance Score</span>
                <span className="text-2xl font-bold">{result.complianceScore.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-current h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(result.complianceScore, 100)}%` }}
                />
              </div>
            </div>

            {/* Fields Sections */}
            <div className="grid grid-cols-2 gap-4">
              {/* Present Fields */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 text-sm">
                  ✅ Fields Present ({result.fieldsPresent.length})
                </h3>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {result.fieldsPresent.length > 0 ? (
                    result.fieldsPresent.map((field, idx) => (
                      <li key={idx} className="text-xs text-green-700">
                        • {field}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-gray-500">All fields present</li>
                  )}
                </ul>
              </div>

              {/* Missing Fields */}
              {result.fieldsMissing.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm">
                    ❌ Fields Missing ({result.fieldsMissing.length})
                  </h3>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {result.fieldsMissing.map((field, idx) => (
                      <li key={idx} className="text-xs text-red-700">
                        • {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Signatures */}
            {(result.signaturesPresent.length > 0 || result.signaturesMissing.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {/* Signatures Present */}
                {result.signaturesPresent.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                      ✍️ Signatures Present ({result.signaturesPresent.length})
                    </h3>
                    <ul className="space-y-1">
                      {result.signaturesPresent.map((sig, idx) => (
                        <li key={idx} className="text-xs text-blue-700">
                          • {sig}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Signatures Missing */}
                {result.signaturesMissing.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-2 text-sm">
                      ⚠️ Signatures Missing ({result.signaturesMissing.length})
                    </h3>
                    <ul className="space-y-1">
                      {result.signaturesMissing.map((sig, idx) => (
                        <li key={idx} className="text-xs text-orange-700">
                          • {sig}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">🚫 Errors</h3>
                <ul className="space-y-1">
                  {result.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {result.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-700">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 flex justify-between pt-2">
              <span>Validation ID: {result.id.substring(0, 8)}...</span>
              <span>Validated: {new Date(result.validatedAt).toLocaleDateString()}</span>
            </div>

            <Button
              onClick={() => setResult(null)}
              variant="secondary"
              className="w-full"
            >
              ← Validate Another Document
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentValidator;
