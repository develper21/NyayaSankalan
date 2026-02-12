import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/common/Loader';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { AdvancedSearch, SearchFilters } from '../../components/search';
import { caseApi } from '../../api';
import type { Case } from '../../types/api.types';
import { getCaseStateBadgeVariant, getCaseStateLabel } from '../../utils/caseState';

export const PoliceMyCases: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchQuery: '',
    status: [],
    dateFrom: '',
    dateTo: '',
    sections: '',
    policeStation: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCases();
  }, []);

  const fetchMyCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await caseApi.getMyCases();
      setCases(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter cases based on search criteria
  const filteredCases = useMemo(() => {
    let filtered = [...cases];

    // Search query (fuzzy search across multiple fields)
    if (searchFilters.searchQuery) {
      const query = searchFilters.searchQuery.toLowerCase();
      filtered = filtered.filter((c) => {
        const firNumber = c.fir?.firNumber?.toLowerCase() || '';
        const sections = c.fir?.sectionsApplied?.toLowerCase() || '';
        const caseId = c.id.toLowerCase();

        return (
          firNumber.includes(query) ||
          sections.includes(query) ||
          caseId.includes(query)
        );
      });
    }

    // Status filter
    if (searchFilters.status.length > 0) {
      filtered = filtered.filter((c) =>
        searchFilters.status.includes(c.state?.currentState || '')
      );
    }

    // Date range filter
    if (searchFilters.dateFrom) {
      const fromDate = new Date(searchFilters.dateFrom);
      filtered = filtered.filter((c) => new Date(c.createdAt) >= fromDate);
    }

    if (searchFilters.dateTo) {
      const toDate = new Date(searchFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((c) => new Date(c.createdAt) <= toDate);
    }

    // IPC Sections filter
    if (searchFilters.sections) {
      const sectionQuery = searchFilters.sections.toLowerCase();
      filtered = filtered.filter((c) =>
        c.fir?.sectionsApplied?.toLowerCase().includes(sectionQuery)
      );
    }

    return filtered;
  }, [cases, searchFilters]);

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleReset = () => {
    setSearchFilters({
      searchQuery: '',
      status: [],
      dateFrom: '',
      dateTo: '',
      sections: '',
      policeStation: '',
    });
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error} retry={fetchMyCases} />;

  return (
    <>
      <Header
        title="My Cases"
        subtitle={`${filteredCases.length} of ${cases.length} cases`}
        action={
          <Link to="/police/create-fir">
            <Button variant="primary">+ Create FIR</Button>
          </Link>
        }
      />

      {/* Advanced Search */}
      <AdvancedSearch onSearch={handleSearch} onReset={handleReset} />

      <Card>
        {filteredCases.length === 0 ? (
          <EmptyState
            message={
              cases.length === 0
                ? 'No cases assigned to you yet'
                : 'No cases match your search criteria'
            }
            action={
              cases.length === 0 ? (
                <Link to="/police/create-fir">
                  <Button variant="primary">Create Your First FIR</Button>
                </Link>
              ) : (
                <Button variant="secondary" onClick={handleReset}>
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FIR Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sections
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCases.map((c) => {
                  const state = c.state?.currentState || 'UNKNOWN';
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/police/cases/${c.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-blue-600">
                          {c.fir?.firNumber || c.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {c.fir?.sectionsApplied || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getCaseStateBadgeVariant(state)}>
                          {getCaseStateLabel(state)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {c.evidence && c.evidence.length > 0 ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {c.evidence.length}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/police/cases/${c.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};
