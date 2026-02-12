import apiClient from './axios';
import type { ApiResponse } from '../types/api.types';

interface ClosureReportResponse {
  reportUrl: string | null;
}

export const closureReportApi = {
  /**
   * GET /api/cases/:caseId/closure-report
   * Get closure report URL
   */
  getClosureReport: async (caseId: string): Promise<string | null> => {
    const response = await apiClient.get<ApiResponse<ClosureReportResponse>>(
      `/cases/${caseId}/closure-report`
    );
    return response.data.data?.reportUrl || null;
  },

  /**
   * POST /api/cases/:caseId/closure-report
   * Generate closure report
   */
  generateClosureReport: async (caseId: string): Promise<string> => {
    const response = await apiClient.post<ApiResponse<ClosureReportResponse>>(
      `/cases/${caseId}/closure-report`
    );
    return response.data.data?.reportUrl || '';
  },
};
