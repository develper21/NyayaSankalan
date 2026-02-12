import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import apiClient from '../../api/axios';
import toast from 'react-hot-toast';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface GenerateDraftModalProps {
  caseId: string;
  onClose: () => void;
  onUseDraft?: (draft: string, documentType: string) => void;
}

const DOCUMENT_OPTIONS = [
  { value: 'CHARGE_SHEET', label: 'Charge Sheet' },
  { value: 'EVIDENCE_LIST', label: 'Evidence List' },
  { value: 'WITNESS_LIST', label: 'Witness List' },
  { value: 'CLOSURE_REPORT', label: 'Closure Report' },
];

export const GenerateDraftModal: React.FC<GenerateDraftModalProps> = ({ caseId, onClose, onUseDraft }) => {
  const [documentType, setDocumentType] = useState<string>('CHARGE_SHEET');
  const [context, setContext] = useState<string>('');
  const [draft, setDraft] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Enable ESC key to close modal
  useEscapeKey(onClose);

  const handleUseDraft = () => {
    if (!draft || !onUseDraft) {
      toast.error('No draft to use');
      return;
    }
    onUseDraft(draft, documentType);
    onClose();
  };

  const handleGenerate = async () => {
    if (!documentType) {
      toast.error('Select a document type');
      return;
    }

    setIsLoading(true);
    setDraft('');
    try {
      const response = await apiClient.post('/ai/generate-draft', {
        caseId,
        documentType,
        context: context || undefined,
      });

      const generated = response.data?.draft || response.data?.data?.draft || '';
      setDraft(generated);
      if (!generated) {
        toast.error('No draft returned');
      }
    } catch (err: unknown) {
      type WithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === 'object' && err !== null
          ? (err as WithResponse).response?.data?.message || (err as Error).message
          : 'Failed to generate draft';
      toast.error(message || 'Failed to generate draft');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      toast.success('Draft copied');
    } catch {
      toast.error('Unable to copy draft');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">AI-Assisted Draft — Review Before Saving</h3>
              <p className="text-sm text-gray-600 mt-1">No auto-save. You remain in control.</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Close (Press ESC)"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
            ⚖ <strong>Officer Review Required</strong> — Draft is system-generated and must be validated before saving.
          </div>
        </div>

        <div className="p-6 space-y-4">
          <Select
            label="Document Type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            options={DOCUMENT_OPTIONS}
          />

          <Textarea
            label="Optional Context"
            placeholder="Provide a short summary, sections, or key facts to guide the draft"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
          />

          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleGenerate} isLoading={isLoading}>
              {isLoading ? '✨ Generating draft...' : '✨ Generate Case Document Draft'}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Draft Preview</p>
              <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!draft}>
                Copy
              </Button>
            </div>
            {draft ? (
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={12} />
            ) : (
              <p className="text-sm text-gray-500">No draft generated yet.</p>
            )}
          </div>

          {draft && onUseDraft && (
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleUseDraft}>
                Save as Document
              </Button>
              <p className="text-xs text-gray-500 self-center">Creates document from this draft</p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Read-only AI assistance: drafts are editable, not stored automatically, and do not change the case workflow.
          </div>
        </div>
      </div>
    </div>
  );
};
