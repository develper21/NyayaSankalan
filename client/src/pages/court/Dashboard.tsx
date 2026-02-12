import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';
import { SectionExplainerCard } from '../../components/ai/SectionExplainerCard';

export const CourtDashboard: React.FC = () => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchCases} />;

  // Filter cases by current state
  const incomingCases = cases.filter(
    (c) => c.state?.currentState === CaseState.SUBMITTED_TO_COURT
  );
  const acceptedCases = cases.filter(
    (c) => c.state?.currentState === CaseState.COURT_ACCEPTED
  );
  const trialCases = cases.filter(
    (c) => c.state?.currentState === CaseState.TRIAL_ONGOING
  );

  return (
    <>
      <Header
        title="Court Clerk Dashboard"
        subtitle="Manage incoming cases and court proceedings"
        action={
          <Link to="/court/incoming-cases">
            <Button variant="primary">View Incoming Cases</Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#FF8C00' }}>{incomingCases.length}</div>
          <div className="dashboard-stat-label">Pending Intake</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#006400' }}>{acceptedCases.length}</div>
          <div className="dashboard-stat-label">Accepted</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#1B4F72' }}>{trialCases.length}</div>
          <div className="dashboard-stat-label">In Trial</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-number" style={{ color: '#5D6D7E' }}>{cases.length}</div>
          <div className="dashboard-stat-label">Total Cases</div>
        </div>
      </div>

      {/* Cases Needing Action */}
      {incomingCases.length > 0 && (
        <Card title="Cases Needing Intake" className="mb-6">
          <div className="space-y-4">
            {incomingCases.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/court/cases/${c.id}`}
                className="case-list-item priority-high block"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="case-list-title">
                      {c.fir?.firNumber || `Case ${c.id.slice(0, 8)}`}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Sections: {c.fir?.sectionsApplied || 'N/A'}
                    </p>
                    <div className="case-list-meta">
                      <span className="case-list-meta-item">Submitted: {new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <Badge variant="warning">Accept Case</Badge>
                </div>
              </Link>
            ))}
            {incomingCases.length > 5 && (
              <Link
                to="/court/incoming-cases"
                className="block text-center text-blue-600 hover:underline font-medium"
              >
                View All {incomingCases.length} Incoming Cases →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Section Explainer with IPC/BNS equivalents and precedents */}
      <div className="mt-6">
        <SectionExplainerCard title="Section Explainer & Precedents" />
      </div>

      {/* Recent Accepted Cases */}
      <Card title="Recently Accepted Cases">
        {acceptedCases.length === 0 ? (
          <EmptyState
            title="No Accepted Cases"
            message="Cases you accept will appear here"
          />
        ) : (
          <div className="space-y-3">
            {acceptedCases.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                to={`/court/cases/${c.id}`}
                className="case-list-item block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="case-list-title">{c.fir?.firNumber || c.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {c.fir?.sectionsApplied || 'N/A'}
                    </p>
                  </div>
                  <Badge variant="success">Accepted</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};
