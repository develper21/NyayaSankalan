// AI Features Type Definitions

export interface CaseReadinessCheckRequest {
  caseId: string;
  caseType: string;
  documentsStatus?: Record<string, boolean>;
  witnessCount?: number;
  evidenceCount?: number;
  timelineInfo?: {
    daysElapsed: number;
    expectedDays: number;
  };
}

export interface CaseReadinessCheckResponse {
  caseId: string;
  readinessScore: number;
  status: 'READY' | 'NOT_READY' | 'NEEDS_ATTENTION';
  documentsStatus: {
    required: string[];
    present: string[];
    missing: string[];
    completeness: number;
  };
  witnesses: {
    required: number;
    present: number;
    status: string;
  };
  evidence: {
    count: number;
    status: string;
  };
  timeline: {
    daysElapsed: number;
    expectedDays: number;
    status: string;
  };
  blockers: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface DocumentValidationRequest {
  documentType: string;
  caseId?: string;
  documentUrl?: string;
  documentBase64?: string;
  documentText?: string;
}

export interface DocumentValidationResponse {
  documentType: string;
  valid: boolean;
  status: 'VALID' | 'INVALID' | 'NEEDS_CORRECTION';
  complianceScore: number;
  fields: {
    required: string[];
    present: string[];
    missing: string[];
  };
  signatures: {
    required: string[];
    present: string[];
    missing: string[];
  };
  pageCount?: number;
  requiredPages?: number;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface CaseBriefRequest {
  caseId: string;
  caseNumber: string;
  caseType: string;
}

export interface CaseBriefResponse {
  caseId: string;
  caseNumber: string;
  caseType: string;
  brief: {
    overview: string;
    parties: {
      prosecution: string[];
      defense: string[];
      victim: string;
    };
    facts: string;
    charges: string[];
    evidence: {
      documents: string[];
      physical: string[];
      witness: string[];
    };
    legalIssues: Array<{
      issue: string;
      applicableLaw: string;
    }>;
    precedents: Array<{
      case: string;
      relevance: string;
      principle: string;
    }>;
    prosecutionArguments: string[];
    defenseArguments: string[];
    keyConsiderations: string[];
    timeline: Array<{
      date: string;
      event: string;
    }>;
    procedureStatus: string;
    attentionAreas: string[];
  };
  timestamp: Date;
}

export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
