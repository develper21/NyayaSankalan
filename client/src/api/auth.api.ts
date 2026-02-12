import apiClient from './axios';
import type { LoginRequest, LoginResponse, User, ApiResponse } from '../types/api.types';

export const authApi = {
  /**
   * POST /api/auth/login
   * Login user and get JWT token
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  },

  /**
   * GET /api/auth/me
   * Get current user info
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  /**
   * Logout - clear local storage
   */
  logout: (): void => {
    localStorage.removeItem('token');
  },
};
