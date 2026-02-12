import apiClient from './axios';
import type { ApiResponse } from '../types/api.types';

export interface SearchResult {
  caseId: string;
  firNumber: string;
  accusedNames: string[];
  caseState: string;
  assignedOfficer: string | null;
  policeStation: string;
  createdAt: string;
}

export const searchApi = {
  /**
   * GET /api/search?q=query
   * Global search
   */
  search: async (query: string, limit: number = 20): Promise<SearchResult[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const response = await apiClient.get<ApiResponse<SearchResult[]>>('/search', {
      params: { q: query, limit },
    });
    return response.data.data || [];
  },
};
