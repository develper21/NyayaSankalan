import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';

export const JudgeCases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (filterState === 'ALL') {
      setFilteredCases(cases);
    } else {
      setFilteredCases(cases.filter((c) => c.state?.currentState === filterState));
    }
  }, [filterState, cases]);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getAllCases();
      setCases(data);
      setFilteredCases(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (state: string) => {
    switch (state) {
      case CaseState.COURT_ACCEPTED:
        return 'info';
      case CaseState.TRIAL_ONGOING:
        return 'warning';
      case CaseState.JUDGMENT_RESERVED:
        return 'default';
      case CaseState.DISPOSED:
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchCases} />;

  return (
    <>
      <Header
        title="All Cases"
        subtitle="Manage court cases and proceedings"
        action={
          <Link to="/judge/dashboard">
            <Button variant="secondary">← Back to Dashboard</Button>
          </Link>
        }
      />

      <Card>
        <div className="mb-6">
          <Select
            label="Filter by State"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Cases' },
              { value: CaseState.COURT_ACCEPTED, label: 'Court Accepted' },
              { value: CaseState.TRIAL_ONGOING, label: 'Trial Ongoing' },
              { value: CaseState.JUDGMENT_RESERVED, label: 'Judgment Reserved' },
              { value: CaseState.DISPOSED, label: 'Disposed' },
              { value: CaseState.APPEALED, label: 'Appealed' },
            ]}
          />
        </div>

        {filteredCases.length === 0 ? (
          <EmptyState
            title="No Cases Found"
            message={
              filterState === 'ALL'
                ? 'No cases available yet.'
                : `No cases in ${filterState.replace(/_/g, ' ')} state.`
            }
          />
        ) : (
          <Table
            data={filteredCases}
            columns={[
              {
                header: 'FIR Number',
                accessor: 'id',
                render: (_value, row) => (
                  <span className="font-medium">
                    {row.fir?.firNumber || row.id.slice(0, 8)}
                  </span>
                ),
              },
              {
                header: 'Sections',
                accessor: 'fir',
                render: (_value, row) => (
                  <span className="text-sm">{row.fir?.sectionsApplied || 'N/A'}</span>
                ),
              },
              {
                header: 'State',
                accessor: 'state',
                render: (_value, row) => (
                  <Badge variant={getBadgeVariant(row.state?.currentState || '')}>
                    {(row.state?.currentState || 'UNKNOWN').replace(/_/g, ' ')}
                  </Badge>
                ),
              },
              {
                header: 'Police Station',
                accessor: 'fir',
                render: (_value, row) => (
                  <span className="text-sm">
                    {row.fir?.policeStation?.name || 'N/A'}
                  </span>
                ),
              },
              {
                header: 'Received',
                accessor: 'createdAt',
                render: (value) => (
                  <span className="text-sm">
                    {new Date(value as string).toLocaleDateString('en-IN')}
                  </span>
                ),
              },
              {
                header: 'Action',
                accessor: 'id',
                render: () => (
                  <span className="text-blue-600 font-medium">View Details →</span>
                ),
              },
            ]}
            onRowClick={(row) => navigate(`/judge/cases/${row.id}`)}
          />
        )}
      </Card>
    </>
  );
};
