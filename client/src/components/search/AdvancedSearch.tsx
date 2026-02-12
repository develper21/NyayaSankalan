import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CaseState } from '../../types/api.types';

export interface SearchFilters {
    searchQuery: string;
    status: string[];
    dateFrom: string;
    dateTo: string;
    sections: string;
    policeStation: string;
}

interface AdvancedSearchProps {
    onSearch: (filters: SearchFilters) => void;
    onReset: () => void;
    isLoading?: boolean;
}

const caseStatusOptions = [
    { value: CaseState.FIR_REGISTERED, label: 'FIR Registered' },
    { value: CaseState.CASE_ASSIGNED, label: 'Case Assigned' },
    { value: CaseState.UNDER_INVESTIGATION, label: 'Under Investigation' },
    { value: CaseState.INVESTIGATION_COMPLETED, label: 'Investigation Completed' },
    { value: CaseState.CHARGE_SHEET_PREPARED, label: 'Charge Sheet Prepared' },
    { value: CaseState.SUBMITTED_TO_COURT, label: 'Submitted to Court' },
    { value: CaseState.COURT_ACCEPTED, label: 'Court Accepted' },
    { value: CaseState.TRIAL_ONGOING, label: 'Trial Ongoing' },
    { value: CaseState.DISPOSED, label: 'Disposed' },
    { value: CaseState.ARCHIVED, label: 'Archived' },
];

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
    onSearch,
    onReset,
    isLoading = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        searchQuery: '',
        status: [],
        dateFrom: '',
        dateTo: '',
        sections: '',
        policeStation: '',
    });

    const handleInputChange = (field: keyof SearchFilters, value: string | string[]) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        onSearch(filters);
    };

    const handleReset = () => {
        const resetFilters: SearchFilters = {
            searchQuery: '',
            status: [],
            dateFrom: '',
            dateTo: '',
            sections: '',
            policeStation: '',
        };
        setFilters(resetFilters);
        onReset();
    };

    const handleStatusToggle = (status: string) => {
        setFilters((prev) => ({
            ...prev,
            status: prev.status.includes(status)
                ? prev.status.filter((s) => s !== status)
                : [...prev.status, status],
        }));
    };

    const activeFilterCount =
        (filters.searchQuery ? 1 : 0) +
        filters.status.length +
        (filters.dateFrom ? 1 : 0) +
        (filters.dateTo ? 1 : 0) +
        (filters.sections ? 1 : 0) +
        (filters.policeStation ? 1 : 0);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            {/* Quick Search Bar */}
            <div className="p-4">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by FIR number, sections, accused name..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={filters.searchQuery}
                            onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button variant="primary" onClick={handleSearch} isLoading={isLoading}>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        Search
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                            />
                        </svg>
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={filters.dateFrom}
                                onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={filters.dateTo}
                                onChange={(e) => handleInputChange('dateTo', e.target.value)}
                            />
                        </div>

                        {/* IPC Sections */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">IPC Sections</label>
                            <input
                                type="text"
                                placeholder="e.g., 302, 307"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={filters.sections}
                                onChange={(e) => handleInputChange('sections', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filters */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Case Status</label>
                        <div className="flex flex-wrap gap-2">
                            {caseStatusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleStatusToggle(option.value)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${filters.status.includes(option.value)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-gray-200">
                        <Button variant="primary" onClick={handleSearch} isLoading={isLoading}>
                            Apply Filters
                        </Button>
                        <Button variant="secondary" onClick={handleReset}>
                            Reset All
                        </Button>
                        <div className="flex-1"></div>
                        {activeFilterCount > 0 && (
                            <span className="text-sm text-gray-600 self-center">
                                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
