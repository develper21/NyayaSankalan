import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { CaseTimeline } from '../../components/case/CaseTimeline';
import { AuditPanel } from '../../components/case/AuditPanel';
import { ClosureReportButton } from '../../components/case/ClosureReportButton';
import { caseApi, courtApi, organizationApi } from '../../api';
import type { Officer } from '../../api/organization.api';
import type { Case, Court } from '../../types/api.types';
import { CaseState } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';

export const SHOCaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [caseDetails, courtsList, officersList] = await Promise.all([
        caseApi.getCaseById(id!),
        courtApi.getCourts(),
        organizationApi.getOfficers(),
      ]);
      setCaseData(caseDetails);
      setCourts(courtsList);
      setOfficers(officersList);
      if (courtsList.length > 0) {
        setSelectedCourt(courtsList[0].id);
      }
      if (officersList.length > 0) {
        setSelectedOfficer(officersList[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignOfficer = async () => {
    if (!selectedOfficer) {
      toast.error('Please select an officer');
      return;
    }

    try {
      setIsAssigning(true);
      await caseApi.assignCase(id!, {
        officerId: selectedOfficer,
        assignmentReason: assignmentReason || 'Assigned by SHO',
      });
      toast.success('Officer assigned successfully');
      setAssignmentReason('');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSubmitToCourt = async () => {
    if (!selectedCourt) {
      toast.error('Please select a court');
      return;
    }

    try {
      setIsSubmitting(true);
      await courtApi.submitToCourt(id!, { courtId: selectedCourt });
      toast.success('Case submitted to court successfully');
      fetchData(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit to court');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;
  if (!caseData) return <ErrorMessage message="Case not found" />;

  const fir = caseData.fir;
  const currentState = caseData.state?.currentState || 'UNKNOWN';
  
  // Check active assignments
  const activeAssignment = caseData.assignments?.find(a => !a.unassignedAt);
  const isUnassigned = !activeAssignment;
  
  // Can assign if FIR_REGISTERED or need to reassign
  const canAssign = currentState === CaseState.FIR_REGISTERED || 
                    currentState === CaseState.CASE_ASSIGNED ||
                    currentState === CaseState.UNDER_INVESTIGATION;
  
  // SHO can submit to court ONLY when investigation is complete
  const canSubmitToCourt = currentState === CaseState.INVESTIGATION_COMPLETED ||
                           currentState === CaseState.CHARGE_SHEET_PREPARED;

  // Show message when case is under investigation
  const isUnderInvestigation = currentState === CaseState.CASE_ASSIGNED ||
                               currentState === CaseState.UNDER_INVESTIGATION;

  const isSubmittedToCourt = currentState === CaseState.SUBMITTED_TO_COURT ||
                             currentState === CaseState.COURT_ACCEPTED ||
                             currentState === CaseState.TRIAL_ONGOING;

  return (
    <>
      <Header
        title={`Case: ${fir?.firNumber || caseData.id.slice(0, 8)}`}
        subtitle={`Status: ${getCaseStateLabel(currentState)}`}
      />

      <div className="space-y-6">
        {/* Unassigned Warning Banner */}
        {isUnassigned && currentState === CaseState.FIR_REGISTERED && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
            <p className="text-orange-800 font-medium">
              ⚠️ This case is awaiting officer assignment
            </p>
            <p className="text-orange-600 text-sm mt-1">
              Please assign a police officer to begin investigation
            </p>
          </div>
        )}

        {/* Case Overview */}
        <Card title="Case Information">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-500">Assignment Status</p>
              <Badge variant={isUnassigned ? 'danger' : 'success'}>
                {isUnassigned ? 'UNASSIGNED' : 'ASSIGNED'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created On</p>
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

        {/* Assign Officer Section - Show prominently if unassigned */}
        {canAssign && !isSubmittedToCourt && (
          <Card title={isUnassigned ? '🔴 Assign Officer (Required)' : 'Reassign Officer'}>
            <div className="space-y-4">
              {isUnassigned ? (
                <p className="text-orange-600 font-medium">
                  No officer is currently assigned. Assign an officer to start investigation.
                </p>
              ) : (
                <p className="text-gray-600">
                  Current officer: <strong>{activeAssignment?.assignedUser?.name}</strong>. 
                  You can reassign to a different officer if needed.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Select Officer"
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  options={officers.map(o => ({
                    value: o.id,
                    label: `${o.name} (${o.email})`,
                  }))}
                />
                <Input
                  label="Assignment Reason (Optional)"
                  placeholder="e.g., Initial assignment, Expertise required"
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleAssignOfficer}
                isLoading={isAssigning}
              >
                {isUnassigned ? 'Assign Officer' : 'Reassign Officer'}
              </Button>
            </div>
          </Card>
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
                  <p className="text-sm text-gray-500">Police Station</p>
                  <p className="font-semibold">
                    {fir.policeStation.name}, {fir.policeStation.district}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Assignment History */}
        <Card title="Assignment History">
          {caseData.assignments && caseData.assignments.length > 0 ? (
            <div className="space-y-3">
              {caseData.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    assignment.unassignedAt ? 'bg-gray-100' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div>
                    <p className="font-medium">{assignment.assignedUser?.name}</p>
                    <p className="text-sm text-gray-500">{assignment.assignmentReason}</p>
                    <p className="text-xs text-gray-400">
                      Assigned: {new Date(assignment.assignedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Badge variant={assignment.unassignedAt ? 'default' : 'success'}>
                    {assignment.unassignedAt ? 'Past' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No Assignment History" 
              message="This case has not been assigned to any officer yet" 
            />
          )}
        </Card>

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

        {/* Under Investigation Banner */}
        {isUnderInvestigation && !isUnassigned && (
          <Card>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium text-lg">
                🔍 Investigation in Progress
              </p>
              <p className="text-blue-600 mt-1">
                The assigned officer is still investigating this case. 
                Once they mark the investigation as complete, you can submit this case to court.
              </p>
            </div>
          </Card>
        )}

        {/* Submit to Court Action */}
        {canSubmitToCourt && (
          <Card title="Submit to Court">
            <div className="space-y-4">
              <p className="text-gray-600">
                Investigation is complete. Select a court to submit this case for prosecution.
              </p>
              <Select
                label="Select Court"
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                options={courts.map(c => ({
                  value: c.id,
                  label: `${c.name} (${c.courtType})`,
                }))}
              />
              <Button
                variant="primary"
                onClick={handleSubmitToCourt}
                isLoading={isSubmitting}
              >
                Submit to Court
              </Button>
            </div>
          </Card>
        )}

        {/* Already Submitted */}
        {isSubmittedToCourt && (
          <Card>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium text-lg">
                ✓ Case Submitted to Court
              </p>
              <p className="text-green-600 mt-1">
                Editing is now locked. Awaiting court proceedings.
              </p>
            </div>
          </Card>
        )}

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
          <Link to="/sho/all-cases">
            <Button variant="secondary">← Back to All Cases</Button>
          </Link>
          <Link to="/sho/dashboard">
            <Button variant="secondary">← Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
};
