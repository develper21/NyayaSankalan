import apiClient from './axios';
import type { FIR, ApiResponse } from '../types/api.types';

export const firApi = {
  /**
   * POST /api/firs
   * Create new FIR - Backend only requires incidentDate and sectionsApplied
   */
  createFIR: async (incidentDate: string, sectionsApplied: string, file?: File): Promise<FIR & { caseId: string }> => {
    const formData = new FormData();
    
    // Required fields
    formData.append('incidentDate', incidentDate);
    formData.append('sectionsApplied', sectionsApplied);
    
    // Add file if present
    if (file) {
      formData.append('file', file);
    }
    
    const response = await apiClient.post<ApiResponse<FIR & { caseId: string }>>('/firs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data!;
  },

  /**
   * GET /api/firs/:firId
   * Get FIR by ID
   */
  getFIRById: async (firId: string): Promise<FIR> => {
    const response = await apiClient.get<ApiResponse<FIR>>(`/firs/${firId}`);
    return response.data.data!;
  },
};
