import apiClient from './axios';
import type { Document, CreateDocumentFormData, ApiResponse } from '../types/api.types';

export const documentApi = {
  /**
   * POST /api/cases/:caseId/documents
   * Create or update document
   */
  createDocument: async (caseId: string, data: CreateDocumentFormData): Promise<Document> => {
    const formData = new FormData();
    
    formData.append('documentType', data.documentType);
    formData.append('contentJson', JSON.stringify(data.contentJson));
    if (data.file) formData.append('document', data.file);
    
    const response = await apiClient.post<ApiResponse<Document>>(
      `/cases/${caseId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/documents
   * Get all documents for case
   */
  getDocuments: async (caseId: string): Promise<Document[]> => {
    const response = await apiClient.get<ApiResponse<Document[]>>(
      `/cases/${caseId}/documents`
    );
    return response.data.data!;
  },

  /**
   * POST /api/documents/:documentId/finalize
   * Finalize document (mark as FINAL)
   */
  finalizeDocument: async (documentId: string): Promise<Document> => {
    const response = await apiClient.post<ApiResponse<Document>>(
      `/documents/${documentId}/finalize`
    );
    return response.data.data!;
  },
};
