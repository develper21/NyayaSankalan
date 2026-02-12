import api from './axios';
import type { CaseReopenRequest } from '../types/api.types';

export const caseReopenApi = {
  requestReopen: async (caseId: string, policeReason: string) => {
    const res = await api.post(`/api/cases/${caseId}/reopen-request`, { policeReason });
    return res.data.data as CaseReopenRequest;
  },

  getMyRequests: async () => {
    const res = await api.get('/api/case-reopen/my-requests');
    return res.data.data as CaseReopenRequest[];
  },

  getPendingForJudge: async () => {
    const res = await api.get('/api/case-reopen/pending');
    return res.data.data as CaseReopenRequest[];
  },

  approve: async (id: string, judgeNote: string) => {
    const res = await api.post(`/api/case-reopen/${id}/approve`, { judgeNote });
    return res.data.data as CaseReopenRequest;
  },

  reject: async (id: string, reason: string) => {
    const res = await api.post(`/api/case-reopen/${id}/reject`, { reason });
    return res.data.data as CaseReopenRequest;
  },
};
