import apiClient from './axios';
import type {
  CourtSubmission,
  CourtAction,
  SubmitToCourtFormData,
  CreateCourtActionFormData,
  ApiResponse,
  Court,
  PoliceStation,
} from '../types/api.types';

export const courtApi = {
  /**
   * GET /api/police-stations
   * Get all police stations
   */
  getPoliceStations: async (): Promise<PoliceStation[]> => {
    const response = await apiClient.get<ApiResponse<PoliceStation[]>>('/police-stations');
    return response.data.data!;
  },

  /**
   * GET /api/courts
   * Get all courts
   */
  getCourts: async (): Promise<Court[]> => {
    const response = await apiClient.get<ApiResponse<Court[]>>('/courts');
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/submit-to-court
   * Submit case to court (locks police editing)
   */
  submitToCourt: async (
    caseId: string,
    data: SubmitToCourtFormData
  ): Promise<CourtSubmission> => {
    const response = await apiClient.post<ApiResponse<CourtSubmission>>(
      `/cases/${caseId}/submit-to-court`,
      data
    );
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/intake
   * Court intake - accept/return case (COURT_CLERK)
   */
  intakeCase: async (caseId: string, data?: { acknowledgementNumber?: string }): Promise<CourtSubmission> => {
    const response = await apiClient.post<ApiResponse<CourtSubmission>>(
      `/cases/${caseId}/intake`,
      data || {}
    );
    return response.data.data!;
  },

  /**
   * POST /api/cases/:caseId/court-actions
   * Create court action (hearings, judgments, etc.)
   */
  createCourtAction: async (
    caseId: string,
    data: CreateCourtActionFormData
  ): Promise<CourtAction> => {
    const response = await apiClient.post<ApiResponse<CourtAction>>(
      `/cases/${caseId}/court-actions`,
      data
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/court-actions
   * Get all court actions for case
   */
  getCourtActions: async (caseId: string): Promise<CourtAction[]> => {
    const response = await apiClient.get<ApiResponse<CourtAction[]>>(
      `/cases/${caseId}/court-actions`
    );
    return response.data.data!;
  },
};
