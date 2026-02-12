import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { closureReportApi } from '../../api/closureReport.api';
import { Button } from '../ui/Button';

interface ClosureReportButtonProps {
  caseId: string;
  isArchived: boolean;
}

export const ClosureReportButton: React.FC<ClosureReportButtonProps> = ({
  caseId,
  isArchived,
}) => {
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isArchived) {
      fetchReport();
    }
  }, [caseId, isArchived]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const url = await closureReportApi.getClosureReport(caseId);
      setReportUrl(url);
    } catch (e) {
      // Report might not exist yet
      setReportUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const url = await closureReportApi.generateClosureReport(caseId);
      setReportUrl(url);
      toast.success('Closure report generated successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  if (!isArchived) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading closure report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Case Closure Report</h3>
            <p className="text-sm text-gray-500">
              {reportUrl 
                ? 'Official closure report is ready for download' 
                : 'Generate the official case closure report'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {reportUrl ? (
            <Button
              variant="primary"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
