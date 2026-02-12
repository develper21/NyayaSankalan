import apiClient from './axios';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const auditApi = {
  getCaseAuditLogs: async (caseId: string): Promise<AuditLog[]> => {
    const response = await apiClient.get(`/cases/${caseId}/audit-logs`);
    return response.data.data || response.data;
  },
};
