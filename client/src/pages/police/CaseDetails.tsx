import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { caseApi, investigationApi } from '../../api';
import { documentRequestsApi } from '../../api/documentRequests.api';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';
import type { Case, DocumentRequest } from '../../types/api.types';
import { CaseState, EvidenceCategory, AccusedStatus } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';
import { CaseTimeline } from '../../components/case/CaseTimeline';
import { AuditPanel } from '../../components/case/AuditPanel';
import { ClosureReportButton } from '../../components/case/ClosureReportButton';
import { GenerateDraftModal } from '../../components/ai/GenerateDraftModal';

export const PoliceCaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [showAccusedForm, setShowAccusedForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftForDocument, setDraftForDocument] = useState<{ draft: string; documentType: string } | null>(null);

  // Document requests for this case
  const [caseRequests, setCaseRequests] = useState<DocumentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Evidence form
  const [evidenceCategory, setEvidenceCategory] = useState<EvidenceCategory>(EvidenceCategory.PHOTO);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [extractingEvidence, setExtractingEvidence] = useState(false);
  const [evidenceExtractedText, setEvidenceExtractedText] = useState('');
  const [evidenceExtractError, setEvidenceExtractError] = useState<string | null>(null);

  // Witness form
  const [witnessName, setWitnessName] = useState('');
  const [witnessContact, setWitnessContact] = useState('');
  const [witnessAddress, setWitnessAddress] = useState('');
  const [witnessStatement, setWitnessStatement] = useState('');

  // Accused form
  const [accusedName, setAccusedName] = useState('');
  const [accusedAddress, setAccusedAddress] = useState('');

  useEffect(() => {
    if (id) {
      fetchCaseDetails();
      loadCaseRequests();
    }
  }, [id]);

  const fetchCaseDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getCaseById(id!);
      setCaseData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is assigned to this case
  const isAssignedToMe = caseData?.assignments?.some(
    a => !a.unassignedAt && a.assignedTo === user?.id
  );

  // Check if case can be edited
  const currentState = caseData?.state?.currentState || 'UNKNOWN';
  const canEdit = isAssignedToMe && (
    currentState === CaseState.CASE_ASSIGNED ||
    currentState === CaseState.UNDER_INVESTIGATION
  );

  const handleAddEvidence = async () => {
    if (!evidenceDescription.trim()) {
      toast.error('Please provide evidence description');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createEvidence(id!, {
        category: evidenceCategory as EvidenceCategory,
        description: evidenceDescription,
        file: evidenceFile || undefined,
      });
      toast.success('Evidence added successfully');
      setShowEvidenceForm(false);
      setEvidenceCategory(EvidenceCategory.PHOTO);
      setEvidenceDescription('');
      setEvidenceFile(null);
      setEvidenceExtractedText('');
      setEvidenceExtractError(null);
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtractEvidenceText = async () => {
    if (!evidenceFile) {
      toast.error('Please select a file first');
      return;
    }

    setExtractingEvidence(true);
    setEvidenceExtractError(null);
    setEvidenceExtractedText('');
    try {
      const formData = new FormData();
      formData.append('file', evidenceFile);

      const response = await apiClient.post('/ai/ocr-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('[Evidence OCR Extract Response]:', response.data);
      
      const text = response.data?.extractedText || response.data?.data?.extractedText || response.data?.data || '';
      setEvidenceExtractedText(text);
      if (!text) {
        toast.error('No text extracted');
      } else {
        toast.success('Text extracted');
      }
    } catch (err: any) {
      console.error('[Evidence OCR Extract Error]:', err.response?.data || err.message);
      const message = err.response?.data?.message || err.response?.data?.error || err.message || 'Extraction failed';
      setEvidenceExtractError(message);
      toast.error(message);
    } finally {
      setExtractingEvidence(false);
    }
  };

  const handleAddWitness = async () => {
    if (!witnessName.trim() || !witnessStatement.trim()) {
      toast.error('Please provide witness name and statement');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createWitness(id!, {
        name: witnessName,
        contact: witnessContact || undefined,
        address: witnessAddress || undefined,
        statement: witnessStatement,
      });
      toast.success('Witness added successfully');
      setShowWitnessForm(false);
      setWitnessName('');
      setWitnessContact('');
      setWitnessAddress('');
      setWitnessStatement('');
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add witness');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAccused = async () => {
    if (!accusedName.trim()) {
      toast.error('Please provide accused name');
      return;
    }

    try {
      setIsSubmitting(true);
      await investigationApi.createAccused(id!, {
        name: accusedName,
        address: accusedAddress || undefined,
        status: AccusedStatus.ABSCONDING,
      });
      toast.success('Accused added successfully');
      setShowAccusedForm(false);
      setAccusedName('');
      setAccusedAddress('');
      fetchCaseDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add accused');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInvestigation = async () => {
    if (!window.confirm('Are you sure you want to mark this investigation as complete? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await caseApi.completeInvestigation(id!);
      toast.success('Investigation marked as complete! SHO can now submit this case to court.');
      fetchCaseDetails();
      await loadCaseRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to complete investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadCaseRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await documentRequestsApi.getByCase(id!);
      setCaseRequests(res);
    } catch (_err) {
      // Ignore silently - show empty list
    } finally {
      setRequestsLoading(false);
    }
  };

  // Case reopen states
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [myReopenRequests, setMyReopenRequests] = useState<any[]>([]);

  const loadMyReopenRequests = async () => {
    try {
      const res = await (await import('../../api/caseReopen.api')).caseReopenApi.getMyRequests();
      setMyReopenRequests(res.filter((r: any) => r.caseId === id));
    } catch (_err) {
      // ignore
    }
  };

  const submitReopenRequest = async () => {
    if (!reopenReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    if (!window.confirm('Requesting case re-open requires judicial approval. Proceed?')) return;

    try {
      setReopenLoading(true);
      await (await import('../../api/caseReopen.api')).caseReopenApi.requestReopen(id!, reopenReason);
      toast.success('Re-open request submitted');
      setShowReopenForm(false);
      setReopenReason('');
      await loadMyReopenRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setReopenLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchCaseDetails} />;
  if (!caseData) return <ErrorMessage message="Case not found" />;

  const fir = caseData.fir;

  return (
    <>
      <Header
        title={`Case: ${fir?.firNumber || caseData.id.slice(0, 8)}`}
        subtitle={`Status: ${currentState.replace(/_/g, ' ')}`}
      />

      <div className="space-y-6">
        {/* Assignment Status Banner */}
        {!isAssignedToMe && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              ⚠️ You are viewing this case in read-only mode
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              You are not currently assigned to this case. Contact your SHO for assignment.
            </p>
          </div>
        )}

        {isAssignedToMe && !canEdit && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-gray-800 font-medium">
              📋 Case is locked for editing
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Current state: {currentState.replace(/_/g, ' ')}. Editing is not allowed in this state.
            </p>
          </div>
        )}

        {canEdit && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              ✓ You are assigned to this case
            </p>
            <p className="text-green-600 text-sm mt-1">
              You can add evidence, witnesses, and accused to this case.
            </p>
          </div>
        )}

        {/* Re-open request (visible only for archived cases) */}
        {isAssignedToMe && currentState === CaseState.ARCHIVED && (
          <Card title="Request Case Re-Open" className="border-yellow-200">
            <p className="text-sm text-gray-600 mb-2">Case re-opening requires judicial approval. Use this form to request re-opening.</p>

            {!showReopenForm && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">You can request the court to re-open this archived case.</div>
                <div>
                  <Button variant="secondary" onClick={() => { setShowReopenForm(true); loadMyReopenRequests(); }}>Request Case Re-Open</Button>
                </div>
              </div>
            )}

            {showReopenForm && (
              <div className="space-y-3">
                <Textarea label="Reason" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" onClick={() => setShowReopenForm(false)}>Cancel</Button>
                  <Button onClick={submitReopenRequest} isLoading={reopenLoading}>Submit Request</Button>
                </div>
              </div>
            )}

            {/* Show my requests for this case */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">My Re-open Requests</h4>
              {myReopenRequests.length === 0 && <div className="text-sm text-gray-600">No re-open requests for this case</div>}
              {myReopenRequests.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <div className="font-medium">{r.status}</div>
                    <div className="text-sm text-gray-600">{r.policeReason}</div>
                  </div>
                  <div className="text-sm text-gray-600">{r.decidedAt ? new Date(r.decidedAt).toLocaleString() : new Date(r.createdAt).toLocaleString()}</div>
                </div>
              ))}
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
              <p className="text-sm text-gray-500">Created On</p>
              <p className="font-semibold">
                {new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Closure Report - Only for ARCHIVED cases */}
        {currentState === CaseState.ARCHIVED && (
          <ClosureReportButton caseId={id!} isArchived={true} />
        )}

        {/* Timeline */}
        <Card title="Timeline">
          <div>
            <CaseTimeline caseId={id!} />
          </div>
        </Card>

        {/* Audit Trail */}
        <Card title="Audit Trail">
          <AuditPanel caseId={id!} />
        </Card>

        {/* FIR Details */}
        {fir && (
          <Card title="FIR Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">FIR Source</p>
                <p className="font-semibold">{fir.firSource}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incident Date</p>
                <p className="font-semibold">
                  {new Date(fir.incidentDate).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Sections Applied</p>
                <p className="font-semibold">{fir.sectionsApplied}</p>
              </div>
              {fir.policeStation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Police Station</p>
                  <p className="font-semibold">
                    {fir.policeStation.name}, {fir.policeStation.district}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Investigation Actions */}
        {canEdit && (
          <Card title="🔍 Investigation Actions">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => setShowEvidenceForm(!showEvidenceForm)}
              >
                + Add Evidence
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowWitnessForm(!showWitnessForm)}
              >
                + Add Witness
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAccusedForm(!showAccusedForm)}
              >
                + Add Accused
              </Button>

              <Button
                variant="secondary"
                onClick={() => window.location.assign(`/police/request-documents?caseId=${id}`)}
              >
                Request Document for this Case
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowDraftModal(true)}
              >
                ✨ Generate Case Document Draft
              </Button>
            </div>

            {/* Mark Investigation Complete */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">✅ Complete Investigation</h4>
                <p className="text-sm text-orange-600 mb-3">
                  Once you have collected all evidence, recorded all witness statements, and identified all accused, 
                  mark the investigation as complete. The SHO will then review and submit the case to court.
                </p>
                <Button
                  variant="primary"
                  onClick={handleCompleteInvestigation}
                  isLoading={isSubmitting}
                >
                  Mark Investigation Complete
                </Button>
              </div>
            </div>

            {/* Evidence Form */}
            {showEvidenceForm && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-3">Add Evidence</h4>
                <div className="space-y-3">
                  <Select
                    label="Category"
                    value={evidenceCategory}
                    onChange={(e) => setEvidenceCategory(e.target.value as EvidenceCategory)}
                    options={[
                      { value: EvidenceCategory.PHOTO, label: 'Photo' },
                      { value: EvidenceCategory.REPORT, label: 'Report' },
                      { value: EvidenceCategory.FORENSIC, label: 'Forensic' },
                      { value: EvidenceCategory.STATEMENT, label: 'Statement' },
                    ]}
                  />
                  <Textarea
                    label="Description"
                    placeholder="Describe the evidence..."
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    rows={3}
                  />
                  <Input
                    label="File (Optional)"
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  />
                  <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-blue-800">Extract Document Text</p>
                        <p className="text-xs text-blue-700">Preview-only. Does not save to database.</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleExtractEvidenceText}
                        isLoading={extractingEvidence}
                        disabled={!evidenceFile}
                      >
                        {extractingEvidence ? '📄 Extracting text...' : '📄 Extract Document Text'}
                      </Button>
                    </div>

                    {evidenceExtractError && (
                      <p className="mt-2 text-sm text-red-600">{evidenceExtractError}</p>
                    )}

                    <div className="mt-3">
                      <Textarea
                        label="Extracted Text"
                        value={evidenceExtractedText}
                        onChange={(e) => setEvidenceExtractedText(e.target.value)}
                        rows={4}
                        placeholder="Extracted text will appear here"
                      />
                      <p className="text-xs text-gray-500 mt-1">Read-only — text is not stored.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleAddEvidence}
                      isLoading={isSubmitting}
                    >
                      Save Evidence
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowEvidenceForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

        {showWitnessForm && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold mb-3">Add Witness</h4>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="Witness full name"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Contact (Optional)"
                  placeholder="Phone number"
                  value={witnessContact}
                  onChange={(e) => setWitnessContact(e.target.value)}
                />
                <Input
                  label="Address (Optional)"
                  placeholder="Full address"
                  value={witnessAddress}
                  onChange={(e) => setWitnessAddress(e.target.value)}
                />
              </div>

              <Textarea
                label="Statement"
                placeholder="Witness statement..."
                value={witnessStatement}
                onChange={(e) => setWitnessStatement(e.target.value)}
                rows={4}
                required
              />

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddWitness}
                  isLoading={isSubmitting}
                >
                  Save Witness
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowWitnessForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDraftModal && id && (
          <GenerateDraftModal
            caseId={id}
            onClose={() => setShowDraftModal(false)}
            onUseDraft={(draft, documentType) => {
              setDraftForDocument({ draft, documentType });
            }}
          />
        )}

        {showAccusedForm && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold mb-3">Add Accused</h4>
            <div className="space-y-3">
              <Input
                label="Name"
                placeholder="Accused full name"
                value={accusedName}
                onChange={(e) => setAccusedName(e.target.value)}
                required
              />
              <Input
                label="Address (Optional)"
                placeholder="Last known address"
                value={accusedAddress}
                onChange={(e) => setAccusedAddress(e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleAddAccused}
                  isLoading={isSubmitting}
                >
                  Save Accused
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAccusedForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

          </Card>
        )}

        {/* Investigation Summary */}
        <Card title="Investigation Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {caseData.evidence?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Evidence</p>
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
                {caseData.documents?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
          </div>
        </Card>

        {/* Evidence List */}
        {caseData.evidence && caseData.evidence.length > 0 && (
          <Card title="Evidence">
            <div className="space-y-2">
              {caseData.evidence.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant="info">{ev.category}</Badge>
                    <p className="text-xs text-gray-400">
                      Uploaded: {new Date(ev.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {ev.fileUrl && (
                    <a
                      href={ev.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Witnesses List */}
        {caseData.witnesses && caseData.witnesses.length > 0 && (
          <Card title="Witnesses">
            <div className="space-y-2">
              {caseData.witnesses.map((w) => (
                <div key={w.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{w.name}</p>
                  {w.contact && <p className="text-sm text-gray-500">📞 {w.contact}</p>}
                  {w.address && <p className="text-sm text-gray-500">📍 {w.address}</p>}
                  {w.statementFileUrl && (
                    w.statementFileUrl.startsWith('http') ? (
                      <a href={w.statementFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">View Statement →</a>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2 italic">"{w.statementFileUrl}"</p>
                    )
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Accused List */}
        {caseData.accused && caseData.accused.length > 0 && (
          <Card title="Accused">
            <div className="space-y-2">
              {caseData.accused.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    {a.address && <p className="text-sm text-gray-500">📍 {a.address}</p>}
                  </div>
                  <Badge
                    variant={
                      a.status === 'ARRESTED' ? 'danger' :
                      a.status === 'ON_BAIL' ? 'warning' : 'default'
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Document Requests for this case */}
        <Card title="Document Requests">
          {requestsLoading && <div>Loading requests...</div>}
          {!requestsLoading && caseRequests.length === 0 && <div>No document requests for this case</div>}
          <div className="space-y-2">
            {caseRequests.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{r.documentType}</div>
                  <div className="text-sm text-gray-600">{r.requestReason} — Requested by {r.requester?.name}</div>
                  {r.remarks && <div className="text-sm text-gray-500">Remarks: {r.remarks}</div>}
                </div>
                <div className="text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded">{r.status}</span>
                  {r.status === 'ISSUED' && (
                    <a href={r.issuedFileUrl || undefined} className="ml-3 text-blue-600" target="_blank" rel="noreferrer">Download</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Draft → Document Creation */}
        {draftForDocument && (
          <Card title="Create Document from AI Draft" className="border-blue-300 bg-blue-50">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Review and edit the AI-generated draft, then save as a document:</p>
              <Textarea
                label="Document Content"
                value={draftForDocument.draft}
                onChange={(e) => setDraftForDocument({ ...draftForDocument, draft: e.target.value })}
                rows={12}
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      await investigationApi.createEvidence(id!, {
                        category: EvidenceCategory.REPORT,
                        description: `AI Generated ${draftForDocument.documentType}`,
                        file: undefined,
                      });
                      toast.success('Document created from draft');
                      setDraftForDocument(null);
                      fetchCaseDetails();
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to create document');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  isLoading={isSubmitting}
                >
                  Save as Document
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDraftForDocument(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
        {/* Back Button */}
        <div className="flex gap-4">
          <Link to="/police/my-cases">
            <Button variant="secondary">← Back to My Cases</Button>
          </Link>
          <Link to="/police/dashboard">
            <Button variant="secondary">← Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
