import axios, { AxiosInstance } from 'axios';
import {
  CaseReadinessCheckRequest,
  CaseReadinessCheckResponse,
  DocumentValidationRequest,
  DocumentValidationResponse,
  CaseBriefRequest,
  CaseBriefResponse,
  AIServiceResponse,
} from './types';

const AI_POC_BASE_URL = process.env.AI_POC_URL || 'http://localhost:8001';

export class AIFeaturesService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: AI_POC_BASE_URL,
      timeout: 30000, // 30 seconds timeout for AI processing
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check case readiness for SHO (Senior Home Officer)
   * Analyzes case status, documents, witnesses, evidence, and timeline
   */
  async checkCaseReadiness(
    request: CaseReadinessCheckRequest
  ): Promise<CaseReadinessCheckResponse> {
    try {
      const response = await this.axiosInstance.post(
        '/api/ai/case-readiness',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Case readiness check failed');
    }
  }

  /**
   * Validate document compliance for Clerk
   * Checks fields, signatures, content quality, and document completeness
   */
  async validateDocument(
    request: DocumentValidationRequest
  ): Promise<DocumentValidationResponse> {
    try {
      const response = await this.axiosInstance.post(
        '/api/ai/document-validate',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Document validation failed');
    }
  }

  /**
   * Generate case brief for Judge
   * Synthesizes comprehensive case analysis with 12 sections
   */
  async generateCaseBrief(
    request: CaseBriefRequest
  ): Promise<CaseBriefResponse> {
    try {
      const response = await this.axiosInstance.post(
        '/api/ai/case-brief',
        request
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Case brief generation failed');
    }
  }

  /**
   * Helper to format AI service errors
   */
  private handleError(error: any, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      const errorMessage =
        data?.error ||
        data?.message ||
        error.message ||
        defaultMessage;

      const errorResponse: AIServiceResponse<null> = {
        success: false,
        error: `[AI Service Error ${status || 'Unknown'}] ${errorMessage}`,
        timestamp: new Date(),
      };

      throw errorResponse;
    }

    throw {
      success: false,
      error: `${defaultMessage}: ${error?.message || 'Unknown error'}`,
      timestamp: new Date(),
    };
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiService = new AIFeaturesService();
