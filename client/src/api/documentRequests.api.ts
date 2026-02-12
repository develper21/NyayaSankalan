import apiClient from './axios';
import type {
  ApiResponse,
  DocumentRequest,
  DocumentRequestType,
} from '../types/api.types';

export const documentRequestsApi = {
  create: async (data: { caseId: string; documentType: DocumentRequestType; requestReason: string }) => {
    const response = await apiClient.post<ApiResponse<DocumentRequest>>('/document-requests', data);
    return response.data.data!;
  },

  getMyRequests: async (): Promise<DocumentRequest[]> => {
    const response = await apiClient.get<ApiResponse<DocumentRequest[]>>('/document-requests/my');
    return response.data.data || [];
  },

  getPendingForSho: async (): Promise<DocumentRequest[]> => {
    const response = await apiClient.get<ApiResponse<DocumentRequest[]>>('/document-requests/pending');
    return response.data.data || [];
  },

  approve: async (id: string) => {
    const response = await apiClient.post<ApiResponse<DocumentRequest>>(`/document-requests/${id}/approve`);
    return response.data.data!;
  },

  reject: async (id: string, reason: string) => {
    const response = await apiClient.post<ApiResponse<DocumentRequest>>(`/document-requests/${id}/reject`, { reason });
    return response.data.data!;
  },

  getApprovedForCourt: async (): Promise<DocumentRequest[]> => {
    const response = await apiClient.get<ApiResponse<DocumentRequest[]>>('/document-requests/approved');
    return response.data.data || [];
  },

  getByCase: async (caseId: string): Promise<DocumentRequest[]> => {
    const response = await apiClient.get<ApiResponse<DocumentRequest[]>>(`/document-requests/case/${caseId}`);
    return response.data.data || [];
  },

  issue: async (id: string, file: File, remarks?: string): Promise<DocumentRequest> => {
    const form = new FormData();
    form.append('file', file);
    if (remarks) form.append('remarks', remarks);

    const response = await apiClient.post<ApiResponse<DocumentRequest>>(`/document-requests/${id}/issue`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data!;
  },
};
