import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/common/Loader';
import { StatCardSkeleton, CardSkeleton } from '../../components/common/SkeletonLoader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';
import { AISearchWidget } from '../../components/ai/AISearchWidget';
import { SectionExplainerCard } from '../../components/ai/SectionExplainerCard';

export const SHODashboard: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getAllCases();
      setCases(data);
    } catch (err: unknown) {
      type ErrorResponse = { response?: { data?: { message?: string } }; message?: string };
      const error = err as ErrorResponse;
      setError(error.response?.data?.message || error.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">SHO Dashboard</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </>
    );
  }
  if (error) return <ErrorMessage message={error} retry={fetchCases} />;

  // Calculate stats
  const totalCases = cases.length;
  
  // Unassigned cases - FIR_REGISTERED with no active assignment
  const unassignedCases = cases.filter(c => {
    const state = c.state?.currentState;
    const hasActiveAssignment = c.assignments?.some(a => !a.unassignedAt);
    return state === CaseState.FIR_REGISTERED && !hasActiveAssignment;
  });
  
  // Cases ready for court submission
  const pendingReview = cases.filter(
    c => c.state?.currentState === CaseState.INVESTIGATION_COMPLETED ||
         c.state?.currentState === CaseState.CHARGE_SHEET_PREPARED
  ).length;
  
  const submittedToCourt = cases.filter(
    c => c.state?.currentState === CaseState.SUBMITTED_TO_COURT ||
         c.state?.currentState === CaseState.COURT_ACCEPTED
  ).length;

  // Cases needing action = unassigned + ready for court
  const casesNeedingAction = cases.filter(
    c => c.state?.currentState === CaseState.INVESTIGATION_COMPLETED ||
         c.state?.currentState === CaseState.CHARGE_SHEET_PREPARED
  );

  return (
    <>
      <Header
        title="SHO Dashboard"
        subtitle="Station House Officer - Case Management"
      />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#1B4F72' }}>{totalCases}</div>
          <div className="dashboard-stat-label">Total Cases</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#8B0000' }}>{unassignedCases.length}</div>
          <div className="dashboard-stat-label">Unassigned</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#FF8C00' }}>{pendingReview}</div>
          <div className="dashboard-stat-label">Ready for Court</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#006400' }}>{submittedToCourt}</div>
          <div className="dashboard-stat-label">Submitted to Court</div>
        </div>
      </div>

      {/* AI Case Similarity & Knowledge Search */}
      <div className="mb-6">
        <AISearchWidget />
      </div>

      {/* Section Explainer with IPC/BNS details and precedents */}
      <div className="mb-6">
        <SectionExplainerCard title="Section Explainer & Precedents" />
      </div>

      {/* Unassigned Cases - Priority 1 */}
      {unassignedCases.length > 0 && (
        <Card title="🔴 Unassigned Cases (Requires Officer Assignment)" className="mb-6">
          <div className="space-y-3">
            {unassignedCases.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/sho/cases/${c.id}`}
                className="case-list-item priority-urgent block"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="case-list-title">{c.fir?.firNumber || c.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-700">{c.fir?.sectionsApplied}</p>
                    <div className="case-list-meta">
                      <span className="case-list-meta-item">Created: {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <Badge variant="danger">UNASSIGNED</Badge>
                </div>
              </Link>
            ))}
            {unassignedCases.length > 5 && (
              <p className="text-center text-gray-500 text-sm">
                +{unassignedCases.length - 5} more unassigned cases
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Cases Needing Action */}
      {casesNeedingAction.length > 0 && (
        <Card title="⚠️ Cases Needing Action">
          <div className="space-y-3">
            {casesNeedingAction.slice(0, 5).map((c) => {
              const state = c.state?.currentState || 'UNKNOWN';
              return (
                <Link
                  key={c.id}
                  to={`/sho/cases/${c.id}`}
                  className="case-list-item priority-high block"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="case-list-title">{c.fir?.firNumber || c.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-700">{c.fir?.sectionsApplied}</p>
                    </div>
                    <Badge variant="warning">{state.replace(/_/g, ' ')}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Cases */}
      <Card title="Recent Cases" className="mt-6">
        {cases.length === 0 ? (
          <EmptyState message="No cases in station yet" />
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 5).map((c) => {
              const state = c.state?.currentState || 'UNKNOWN';
              return (
                <Link
                  key={c.id}
                  to={`/sho/cases/${c.id}`}
                  className="case-list-item block"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="case-list-title">{c.fir?.firNumber}</p>
                      <div className="case-list-meta">
                        <span className="case-list-meta-item">
                          📅 {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge variant={getCaseStateBadgeVariant(state)}>
                      {getCaseStateLabel(state)}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            <Link to="/sho/all-cases" className="block text-center text-blue-600 hover:underline py-2">
              View All Cases →
            </Link>
          </div>
        )}
      </Card>
    </>
  );
};
