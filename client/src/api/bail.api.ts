import apiClient from './axios';
import type { BailRecord, CreateBailRecordFormData, ApiResponse } from '../types/api.types';

export const bailApi = {
  /**
   * POST /api/cases/:caseId/bail-applications
   * Create bail record/application
   */
  createBailRecord: async (
    caseId: string,
    data: CreateBailRecordFormData
  ): Promise<BailRecord> => {
    const response = await apiClient.post<ApiResponse<BailRecord>>(
      `/cases/${caseId}/bail-applications`,
      data
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/bail-applications
   * Get all bail records for case
   */
  getBailRecords: async (caseId: string): Promise<BailRecord[]> => {
    const response = await apiClient.get<ApiResponse<BailRecord[]>>(
      `/cases/${caseId}/bail-applications`
    );
    return response.data.data!;
  },
};
