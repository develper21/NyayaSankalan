import apiClient from './axios';

const API_BASE = '/ai';

interface CaseReadinessRequest {
  caseType: string;
  witnessCount: number;
  evidenceCount: number;
  timelineInfo: {
    daysElapsed: number;
    expectedDays: number;
  };
}

interface DocumentValidationRequest {
  documentType: string;
  documentName: string;
}

interface CaseBriefRequest {
  caseNumber: string;
  caseType: string;
}

export const aiApi = {
  /**
   * Check case readiness status
   */
  checkCaseReadiness: async (caseId: string, data: CaseReadinessRequest) => {
    return apiClient.post(`${API_BASE}/case-readiness`, { caseId, ...data });
  },

  /**
   * Get case readiness history
   */
  getCaseReadinessHistory: async (caseId: string) => {
    return apiClient.get(`${API_BASE}/case-readiness/${caseId}`);
  },

  /**
   * Validate a document
   */
  validateDocument: async (caseId: string, data: DocumentValidationRequest) => {
    return apiClient.post(`${API_BASE}/document-validate`, { caseId, ...data });
  },

  /**
   * Get document validation history
   */
  getDocumentValidationHistory: async (caseId: string) => {
    return apiClient.get(`${API_BASE}/document-validations/${caseId}`);
  },

  /**
   * Generate case brief
   */
  generateCaseBrief: async (caseId: string, data: CaseBriefRequest) => {
    return apiClient.post(`${API_BASE}/case-brief`, { caseId, ...data });
  },

  /**
   * Get case brief history
   */
  getCaseBriefHistory: async (caseId: string) => {
    return apiClient.get(`${API_BASE}/case-brief/${caseId}`);
  },
};

export default aiApi;
