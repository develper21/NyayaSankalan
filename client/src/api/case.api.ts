import apiClient from './axios';
import type { Case, AssignCaseFormData, ApiResponse } from '../types/api.types';

// Response type for paginated cases
interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const caseApi = {
  /**
   * GET /api/cases/my
   * Get my assigned cases (for POLICE)
   */
  getMyCases: async (): Promise<Case[]> => {
    const response = await apiClient.get<ApiResponse<CasesResponse>>('/cases/my');
    return response.data.data?.cases || [];
  },

  /**
   * GET /api/cases/all
   * Get all cases (for SHO, COURT_CLERK, JUDGE)
   */
  getAllCases: async (): Promise<Case[]> => {
    const response = await apiClient.get<ApiResponse<CasesResponse>>('/cases/all');
    return response.data.data?.cases || [];
  },

  /**
   * GET /api/cases/:caseId
   * Get case by ID
   */
  getCaseById: async (caseId: string): Promise<Case> => {
    const response = await apiClient.get<ApiResponse<Case>>(`/cases/${caseId}`);
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/assign
   * Assign case to officer (SHO only)
   */
  assignCase: async (caseId: string, data: AssignCaseFormData): Promise<Case> => {
    const response = await apiClient.post<ApiResponse<Case>>(
      `/cases/${caseId}/assign`,
      data
    );
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/archive
   * Archive case (SHO/JUDGE)
   */
  archiveCase: async (caseId: string): Promise<Case> => {
    const response = await apiClient.post<ApiResponse<Case>>(`/cases/${caseId}/archive`);
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/complete-investigation
   * Mark investigation as complete (POLICE only)
   */
  completeInvestigation: async (caseId: string): Promise<{ caseId: string; previousState: string; newState: string }> => {
    const response = await apiClient.post<ApiResponse<{ caseId: string; previousState: string; newState: string }>>(
      `/cases/${caseId}/complete-investigation`
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases
   * Generic paginated list based on role (used by SHO/Court/Judge)
   */
  getCases: async (_organizationId: string, _userRole: 'SHO' | 'COURT_CLERK' | 'JUDGE', page = 1, limit = 20): Promise<CasesResponse> => {
    const response = await apiClient.get<ApiResponse<CasesResponse>>('/cases/all', { params: { page, limit } });
    return response.data.data || { cases: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * POST /api/cases/:caseId/judicial-close
   * Judicial case closure (JUDGE only) - Archives and generates closure report
   */
  judicialCloseCase: async (caseId: string): Promise<{ caseId: string; archived: boolean; closureReportUrl: string | null }> => {
    const response = await apiClient.post<ApiResponse<{ caseId: string; archived: boolean; closureReportUrl: string | null }>>(
      `/cases/${caseId}/judicial-close`
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/can-close
   * Check if case can be closed by judge
   */
  canCloseCase: async (caseId: string): Promise<{ canClose: boolean; reason?: string }> => {
    const response = await apiClient.get<ApiResponse<{ canClose: boolean; reason?: string }>>(
      `/cases/${caseId}/can-close`
    );
    return response.data.data || { canClose: false };
  },
};
