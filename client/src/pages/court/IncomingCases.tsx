import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { CaseState } from '../../types/api.types';

export const IncomingCases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchIncomingCases();
  }, []);

  const fetchIncomingCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getAllCases();
      // Filter to only show cases submitted to court (pending intake)
      const incoming = data.filter(
        (c) => c.state?.currentState === CaseState.SUBMITTED_TO_COURT
      );
      setCases(incoming);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchIncomingCases} />;

  return (
    <>
      <Header
        title="Incoming Cases"
        subtitle="Cases submitted by police, awaiting court intake"
        action={
          <Link to="/court/dashboard">
            <Button variant="secondary">← Back to Dashboard</Button>
          </Link>
        }
      />

      <Card>
        {cases.length === 0 ? (
          <EmptyState
            title="No Incoming Cases"
            message="All submitted cases have been processed."
          />
        ) : (
          <Table
            data={cases}
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
                header: 'Police Station',
                accessor: 'fir',
                render: (_value, row) => (
                  <span className="text-sm">
                    {row.fir?.policeStation?.name || 'N/A'}
                  </span>
                ),
              },
              {
                header: 'Submitted',
                accessor: 'createdAt',
                render: (value) => (
                  <span className="text-sm">
                    {new Date(value as string).toLocaleDateString('en-IN')}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: 'state',
                render: () => <Badge variant="warning">Pending Intake</Badge>,
              },
              {
                header: 'Action',
                accessor: 'id',
                render: () => (
                  <span className="text-blue-600 font-medium">Accept Case →</span>
                ),
              },
            ]}
            onRowClick={(row) => navigate(`/court/cases/${row.id}`)}
          />
        )}
      </Card>
    </>
  );
};
