import apiClient from './axios';
import type { TimelineEvent, AuditLog, ApiResponse } from '../types/api.types';

interface AuditLogResult {
  logs: AuditLog[];
  forbidden: boolean;
}

export const timelineApi = {
  /**
   * GET /api/cases/:caseId/timeline
   * Get complete case timeline
   */
  getCaseTimeline: async (caseId: string): Promise<TimelineEvent[]> => {
    const response = await apiClient.get<ApiResponse<TimelineEvent[]>>(
      `/cases/${caseId}/timeline`
    );
    return response.data.data || [];
  },

  /**
   * GET /api/cases/:caseId/audit-logs
   * Get audit logs for case
   */
  getAuditLogs: async (caseId: string): Promise<AuditLogResult> => {
    try {
      const response = await apiClient.get<ApiResponse<AuditLog[]>>(
        `/cases/${caseId}/audit-logs`,
        {
          // Prevent console error spam: treat 403 as a handled response
          validateStatus: () => true,
        }
      );

      if (response.status === 403) {
        return { logs: [], forbidden: true };
      }

      if (response.status >= 200 && response.status < 300) {
        return { logs: response.data.data || [], forbidden: false };
      }

      // For other non-2xx, throw to be handled upstream
      throw new Error(response.data?.message || 'Failed to fetch audit logs');
    } catch (err: unknown) {
      // Swallow access denials to avoid console noise when polling cases outside user's org
      const isForbidden =
        typeof err === 'object' && err !== null &&
        (err as { response?: { status?: number } }).response?.status === 403;
      if (isForbidden) return { logs: [], forbidden: true };
      throw err;
    }
  },
};
