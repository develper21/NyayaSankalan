import apiClient from './axios';
import type {
  InvestigationEvent,
  Evidence,
  Witness,
  Accused,
  CreateEvidenceFormData,
  CreateWitnessFormData,
  CreateAccusedFormData,
  ApiResponse,
} from '../types/api.types';

export const investigationApi = {
  // ========== Investigation Events ==========
  
  /**
   * POST /api/cases/:caseId/investigation-events
   * Create investigation event
   */
  createInvestigationEvent: async (
    caseId: string,
    data: { eventType: string; eventDate: string; description: string }
  ): Promise<InvestigationEvent> => {
    const response = await apiClient.post<ApiResponse<InvestigationEvent>>(
      `/cases/${caseId}/investigation-events`,
      data
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/investigation-events
   * Get all investigation events for case
   */
  getInvestigationEvents: async (caseId: string): Promise<InvestigationEvent[]> => {
    const response = await apiClient.get<ApiResponse<InvestigationEvent[]>>(
      `/cases/${caseId}/investigation-events`
    );
    return response.data.data!;
  },

  // ========== Evidence ==========
  
  /**
   * POST /api/cases/:caseId/evidence
   * Add evidence with optional file upload
   */
  createEvidence: async (caseId: string, data: CreateEvidenceFormData): Promise<Evidence> => {
    const formData = new FormData();
    
    formData.append('category', data.category);
    formData.append('description', data.description);
    if (data.collectedDate) formData.append('collectedDate', data.collectedDate);
    if (data.collectedFrom) formData.append('collectedFrom', data.collectedFrom);
    if (data.file) formData.append('file', data.file);
    
    const response = await apiClient.post<ApiResponse<Evidence>>(
      `/cases/${caseId}/evidence`,
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
   * GET /api/cases/:caseId/evidence
   * Get all evidence for case
   */
  getEvidence: async (caseId: string): Promise<Evidence[]> => {
    const response = await apiClient.get<ApiResponse<Evidence[]>>(
      `/cases/${caseId}/evidence`
    );
    return response.data.data!;
  },

  // ========== Witnesses ==========
  
  /**
   * POST /api/cases/:caseId/witnesses
   * Add witness with optional statement file
   */
  createWitness: async (caseId: string, data: CreateWitnessFormData): Promise<Witness> => {
    const formData = new FormData();
    
    formData.append('name', data.name);
    if (data.contact) formData.append('contact', data.contact);
    if (data.address) formData.append('address', data.address);
    formData.append('statement', data.statement);
    if (data.statementFile) formData.append('statementFile', data.statementFile);
    
    const response = await apiClient.post<ApiResponse<Witness>>(
      `/cases/${caseId}/witnesses`,
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
   * GET /api/cases/:caseId/witnesses
   * Get all witnesses for case
   */
  getWitnesses: async (caseId: string): Promise<Witness[]> => {
    const response = await apiClient.get<ApiResponse<Witness[]>>(
      `/cases/${caseId}/witnesses`
    );
    return response.data.data!;
  },

  // ========== Accused ==========
  
  /**
   * POST /api/cases/:caseId/accused
   * Add accused person
   */
  createAccused: async (caseId: string, data: CreateAccusedFormData): Promise<Accused> => {
    const response = await apiClient.post<ApiResponse<Accused>>(
      `/cases/${caseId}/accused`,
      data
    );
    return response.data.data!;
  },

  /**
   * GET /api/cases/:caseId/accused
   * Get all accused for case
   */
  getAccused: async (caseId: string): Promise<Accused[]> => {
    const response = await apiClient.get<ApiResponse<Accused[]>>(
      `/cases/${caseId}/accused`
    );
    return response.data.data!;
  },
};
