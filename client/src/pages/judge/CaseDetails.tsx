import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { CaseTimeline } from '../../components/case/CaseTimeline';
import { AuditPanel } from '../../components/case/AuditPanel';
import { ClosureReportButton } from '../../components/case/ClosureReportButton';
import { caseApi, courtApi } from '../../api';
import apiClient from '../../api/axios';
import jsPDF from 'jspdf';
import type { Case, CourtAction } from '../../types/api.types';
import { CaseState, CourtActionType } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel, isInCourt } from '../../utils/caseState';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export const JudgeCaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [courtActions, setCourtActions] = useState<CourtAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);

  const isHearingDraftEnabled = (import.meta.env.VITE_FEATURE_HEARING_ORDER_AI ?? 'true') !== 'false';

  // Enable ESC key to close modal
  useEscapeKey(() => setIsDraftModalOpen(false), isDraftModalOpen);

  // Court action form state
  const [actionType, setActionType] = useState<CourtActionType>(CourtActionType.HEARING);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [caseDetails, actions] = await Promise.all([
        caseApi.getCaseById(id!),
        courtApi.getCourtActions(id!).catch(() => []),
      ]);
      setCaseData(caseDetails);
      setCourtActions(actions);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordAction = async () => {
    try {
      setIsSubmitting(true);
      await courtApi.createCourtAction(id!, {
        actionType,
        actionDate: new Date(actionDate).toISOString(),
      });
      toast.success('Court action recorded successfully');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record court action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCase = async () => {
    if (!confirm('Are you sure you want to close this case? This action will:\n\n• Archive the case permanently\n• Generate the official closure report\n• Make the case read-only\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      setIsClosing(true);
      const result = await caseApi.judicialCloseCase(id!);
      toast.success('Case closed successfully. Closure report generated.');
      if (result.closureReportUrl) {
        // Open the report in a new tab
        window.open(result.closureReportUrl, '_blank');
      }
      fetchData(); // Refresh data to show archived state
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to close case');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;
  if (!caseData) return <ErrorMessage message="Case not found" />;

  const fir = caseData.fir;
  const currentState = caseData.state?.currentState || 'UNKNOWN';

  // Judge can record actions on court-accepted or trial-ongoing cases
  const canRecordAction = isInCourt(currentState);

  // Judge can close cases that are in closable states (not already archived)
  const closableStates = [
    CaseState.DISPOSED,
    CaseState.JUDGMENT_RESERVED,
    CaseState.TRIAL_ONGOING,
    CaseState.COURT_ACCEPTED,
  ];
  const canCloseCase = closableStates.includes(currentState as CaseState);

  const buildHearingOrderContext = () => {
    const firNumber = fir?.firNumber || caseData.id.slice(0, 8);
    const hearingDateLabel = actionDate ? new Date(actionDate).toLocaleDateString('en-IN') : 'Not set';
    const sections = fir?.sectionsApplied || 'Not specified';
    const partiesSummary = `Accused: ${caseData.accused?.length || 0}; Witnesses: ${caseData.witnesses?.length || 0}`;

    return [
      `Hearing order draft inputs:`,
      `Case: ${firNumber} (ID: ${caseData.id})`,
      `Hearing date: ${hearingDateLabel}`,
      `IPC sections / charges: ${sections}`,
      `Parties / advocates: ${partiesSummary}`,
      `Issues considered: <list issues>`,
      `Directions / compliance actions: <list directions, timelines, responsible parties>`,
    ].join('\n');
  };

  const handleGenerateHearingOrder = async () => {
    if (!caseData) return;
    setIsGeneratingDraft(true);
    setDraftError(null);
    setDraftText('');
    try {
      const response = await apiClient.post('/ai/generate-draft', {
        caseId: caseData.id,
        documentType: 'HEARING_ORDER',
        context: buildHearingOrderContext(),
      }, { timeout: 60000 });
      const generated = response.data?.draft || response.data?.data?.draft || '';
      setDraftText(generated);
      if (!generated) {
        setDraftError('No draft returned by AI.');
      }
    } catch (err: unknown) {
      type WithResponse = { response?: { data?: { message?: string } } };
      const message =
        typeof err === 'object' && err !== null
          ? (err as WithResponse).response?.data?.message || (err as Error).message
          : 'Failed to generate draft';
      setDraftError(message || 'Failed to generate draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCopyDraft = async () => {
    if (!draftText) return;
    try {
      await navigator.clipboard.writeText(draftText);
      toast.success('Draft copied to clipboard');
    } catch {
      toast.error('Unable to copy draft');
    }
  };

  const handleDownloadDraft = () => {
    if (!draftText) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      const lineHeight = 7;

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Hearing Order', pageWidth / 2, 20, { align: 'center' });

      // Case info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let yPos = 35;
      if (caseData?.fir?.firNumber) {
        doc.text(`FIR Number: ${caseData.fir.firNumber}`, margin, yPos);
        yPos += lineHeight;
      }
      doc.text(`Case ID: ${caseData?.id}`, margin, yPos);
      yPos += lineHeight + 5;

      // Draft content
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(draftText, maxWidth);

      lines.forEach((line: string) => {
        if (yPos + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += lineHeight;
      });

      doc.save(`hearing-order-${caseData?.fir?.firNumber || caseData?.id}.pdf`);
      toast.success('Draft downloaded as PDF');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case CourtActionType.COGNIZANCE:
        return 'info';
      case CourtActionType.HEARING:
        return 'warning';
      case CourtActionType.JUDGMENT:
      case CourtActionType.CONVICTION:
      case CourtActionType.ACQUITTAL:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Header
        title={`Case: ${fir?.firNumber || caseData.id.slice(0, 8)}`}
        subtitle={`Status: ${getCaseStateLabel(currentState)}`}
      />

      <div className="space-y-6">
        {isHearingDraftEnabled && (
          <Card title="AI Assistance (Read-only)">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Generate a hearing order draft. Read-only, no auto-save, no DB writes.
              </div>
              <Button
                variant="primary"
                className="flex items-center gap-2"
                onClick={() => setIsDraftModalOpen(true)}
              >
                ⚖ Generate Hearing Order Draft
              </Button>
            </div>
          </Card>
        )}

        {/* Case Overview */}
        <Card title="Case Information">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">FIR Number</p>
              <p className="font-semibold text-lg">{fir?.firNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Case State</p>
              <Badge variant={getCaseStateBadgeVariant(currentState)}>
                {getCaseStateLabel(currentState)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Received On</p>
              <p className="font-semibold">
                {new Date(caseData.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </Card>

        {/* Closure Report - Only for ARCHIVED cases */}
        {currentState === CaseState.ARCHIVED && (
          <ClosureReportButton caseId={id!} isArchived={true} />
        )}

        {/* FIR Details */}
        {fir && (
          <Card title="FIR Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Sections Applied</p>
                <p className="font-semibold">{fir.sectionsApplied}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incident Date</p>
                <p className="font-semibold">
                  {new Date(fir.incidentDate).toLocaleString('en-IN')}
                </p>
              </div>
              {fir.policeStation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">From Police Station</p>
                  <p className="font-semibold">
                    {fir.policeStation.name}, {fir.policeStation.district}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Case Summary */}
        <Card title="Case Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {caseData.evidence?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Evidence Items</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {caseData.witnesses?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Witnesses</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {caseData.accused?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Accused</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {courtActions.length}
              </p>
              <p className="text-sm text-gray-600">Court Actions</p>
            </div>
          </div>
        </Card>

        {/* Record Court Action */}
        {canRecordAction && (
          <Card title="Record Court Action">
            <div className="space-y-4">
              <p className="text-gray-600">
                Record a court action for this case (hearing, judgment, etc.)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Action Type"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as CourtActionType)}
                  options={[
                    { value: CourtActionType.COGNIZANCE, label: 'Cognizance Taken' },
                    { value: CourtActionType.CHARGES_FRAMED, label: 'Charges Framed' },
                    { value: CourtActionType.HEARING, label: 'Hearing' },
                    { value: CourtActionType.JUDGMENT, label: 'Judgment' },
                    { value: CourtActionType.SENTENCE, label: 'Sentence' },
                    { value: CourtActionType.ACQUITTAL, label: 'Acquittal' },
                    { value: CourtActionType.CONVICTION, label: 'Conviction' },
                  ]}
                />
                <Input
                  label="Action Date"
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleRecordAction}
                isLoading={isSubmitting}
              >
                Record Action
              </Button>
            </div>
          </Card>
        )}

        {/* Judicial Case Closure - Only for Judge, only for closable cases */}
        {canCloseCase && (
          <Card title="Judicial Case Closure">
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-amber-800 font-medium">Close Case Permanently</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Closing this case will:
                    </p>
                    <ul className="text-amber-700 text-sm mt-2 list-disc list-inside space-y-1">
                      <li>Archive the case permanently</li>
                      <li>Generate the official Case Closure Report (PDF)</li>
                      <li>Make the case read-only for all users</li>
                    </ul>
                    <p className="text-amber-700 text-sm mt-2 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  onClick={handleCloseCase}
                  isLoading={isClosing}
                  className="flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Close Case & Generate Report
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Case Disposed */}
        {currentState === CaseState.DISPOSED && (
          <Card>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium text-lg">
                ✓ Case Disposed
              </p>
              <p className="text-green-600 mt-1">
                This case has been concluded
              </p>
            </div>
          </Card>
        )}

        {/* Court Actions History */}
        <Card title="Court Actions History">
          {courtActions.length === 0 ? (
            <EmptyState
              title="No Court Actions Yet"
              message="Court actions will appear here when recorded"
            />
          ) : (
            <div className="space-y-3">
              {courtActions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {action.actionType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Date: {new Date(action.actionDate).toLocaleDateString('en-IN')}
                      </p>
                      {action.orderFileUrl && (
                        <a
                          href={action.orderFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 block"
                        >
                          View Order Document →
                        </a>
                      )}
                    </div>
                    <Badge variant={getActionBadgeVariant(action.actionType)}>
                      {action.actionType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Case Timeline */}
        <Card title="Case Timeline">
          <CaseTimeline caseId={id!} />
        </Card>

        {/* Audit Trail */}
        <Card title="Audit Trail">
          <AuditPanel caseId={id!} />
        </Card>

        {/* Back Button */}
        <div className="flex gap-4">
          <Link to="/judge/cases">
            <Button variant="secondary">← Back to All Cases</Button>
          </Link>
          <Link to="/judge/dashboard">
            <Button variant="secondary">← Dashboard</Button>
          </Link>
        </div>
      </div>

      {isHearingDraftEnabled && isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Hearing Order Draft (AI-assisted)</h3>
                  <p className="text-sm text-gray-600 mt-1">Read-only assistance. Nothing is auto-saved or attached.</p>
                </div>
                <button
                  onClick={() => setIsDraftModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Close (Press ESC)"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                ⚠ Human-in-loop — Review and edit before use. No DB write or workflow change.
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="primary" onClick={handleGenerateHearingOrder} isLoading={isGeneratingDraft}>
                  {isGeneratingDraft ? '✨ Generating...' : '✨ Generate Hearing Order Draft'}
                </Button>
                <Button variant="secondary" onClick={() => setIsDraftModalOpen(false)}>
                  Close
                </Button>
                <div className="text-xs text-gray-500">Copy-only. No auto-save.</div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Draft Preview</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopyDraft} disabled={!draftText}>
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadDraft} disabled={!draftText}>
                      Download
                    </Button>
                  </div>
                </div>
                {draftError && <p className="text-sm text-red-600 mb-2">{draftError}</p>}
                {draftText ? (
                  <Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={12} />
                ) : (
                  <p className="text-sm text-gray-500">No draft generated yet.</p>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Read-only AI assistance: editable text, copy/download only. No database writes or workflow changes.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
