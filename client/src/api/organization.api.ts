import apiClient from './axios';
import type { ApiResponse, PoliceStation, Court } from '../types/api.types';

export interface Officer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const organizationApi = {
  /**
   * GET /api/police-stations
   * Get all police stations
   */
  getPoliceStations: async (): Promise<PoliceStation[]> => {
    const response = await apiClient.get<ApiResponse<PoliceStation[]>>('/police-stations');
    return response.data.data || [];
  },

  /**
   * GET /api/courts
   * Get all courts
   */
  getCourts: async (): Promise<Court[]> => {
    const response = await apiClient.get<ApiResponse<Court[]>>('/courts');
    return response.data.data || [];
  },

  /**
   * GET /api/officers
   * Get police officers in current user's station (SHO only)
   */
  getOfficers: async (): Promise<Officer[]> => {
    const response = await apiClient.get<ApiResponse<Officer[]>>('/officers');
    return response.data.data || [];
  },
};
