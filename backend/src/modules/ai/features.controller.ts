import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { aiService } from './features.service';
import { ApiError } from '../../utils/ApiError';
import {
  CaseReadinessCheckRequest,
  DocumentValidationRequest,
  CaseBriefRequest,
} from './types';

export class AIFeaturesController {
  /**
   * POST /api/ai/case-readiness
   * Endpoint for SHO to check case readiness
   */
  static async checkCaseReadiness(req: Request, res: Response) {
    try {
      const { caseId, caseType } = req.body;
      const userId = (req.user as any)?.id; // From auth middleware

      if (!caseId || !caseType || !userId) {
        throw new ApiError(400, 'Missing required fields: caseId, caseType');
      }

      // Fetch real case data with all relationships
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          fir: true,
          documents: true,
          witnesses: true,
          evidence: true,
          state: true,
        },
      });

      if (!caseData) {
        throw new ApiError(404, 'Case not found');
      }

      // Calculate real values from database
      const witnessCount = caseData.witnesses.length;
      const evidenceCount = caseData.evidence.length;
      const daysElapsed = Math.floor(
        (Date.now() - new Date(caseData.fir.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const documentTypes = caseData.documents.map((d) => d.documentType);

      // Call AI service with real data
      const readinessCheckRequest: CaseReadinessCheckRequest = {
        caseId,
        caseType,
        witnessCount,
        evidenceCount,
        timelineInfo: {
          daysElapsed,
          expectedDays: 90, // Can be configured per case type
        },
      };

      const result = await aiService.checkCaseReadiness(readinessCheckRequest);

      console.log('✅ AI Service returned:', JSON.stringify(result, null, 2));

      // Extract data from AI service response (it returns {success, data})
      const aiData = (result as any).data || result;

      // Save to database for persistence and history
      const savedCheck = await prisma.caseReadinessCheck.create({
        data: {
          caseId,
          checkedBy: userId,
          caseType,
          readinessScore: aiData.readiness_score || 0,
          status: aiData.status || 'PENDING',
          documentsRequired: aiData.document_analysis?.missing || [],
          documentsPresent: aiData.document_analysis?.present || [],
          documentsMissing: aiData.document_analysis?.missing || [],
          documentCompleteness: aiData.document_analysis?.completeness || 0,
          witnessesRequired: aiData.witness_analysis?.required || 0,
          witnessesPresent: aiData.witness_analysis?.count || 0,
          witnessStatus: aiData.witness_analysis?.status || 'UNKNOWN',
          evidenceCount: aiData.evidence_analysis?.count || 0,
          evidenceStatus: aiData.evidence_analysis?.status || 'UNKNOWN',
          daysElapsed: aiData.timeline_analysis?.days_elapsed || 0,
          expectedDays: aiData.timeline_analysis?.expected_days || 90,
          timelineStatus: aiData.timeline_analysis?.status || 'UNKNOWN',
          blockers: aiData.blockers || [],
          recommendations: aiData.recommendations || [],
        },
        include: {
          checker: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          id: savedCheck.id,
          readinessScore: savedCheck.readinessScore,
          status: savedCheck.status,
          blockers: savedCheck.blockers,
          recommendations: savedCheck.recommendations,
          checkedAt: savedCheck.createdAt,
        },
      });
    } catch (error) {
      console.error('❌ Case Readiness Check Error:', error);
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Failed to check case readiness',
      });
    }
  }

  /**
   * POST /api/ai/document-validate
   * Endpoint for Clerk to validate documents
   */
  static async validateDocument(req: Request, res: Response) {
    try {
      const { documentType, caseId, ...otherData } = req.body;
      const userId = (req.user as any)?.id; // From auth middleware

      if (!documentType || !userId) {
        throw new ApiError(400, 'Missing required fields: documentType');
      }

      // Validate case exists if caseId provided
      if (caseId) {
        const caseExists = await prisma.case.findUnique({
          where: { id: caseId },
        });

        if (!caseExists) {
          throw new ApiError(404, 'Case not found');
        }
      }

      // Call AI service
      const validationRequest: DocumentValidationRequest = {
        documentType,
        caseId,
        ...otherData,
      };

      const result = await aiService.validateDocument(validationRequest);

      // Save to database for persistence and history
      const savedValidation = await prisma.documentValidation.create({
        data: {
          caseId: caseId || null,
          validatedBy: userId,
          documentType,
          documentName: otherData.documentName || 'Document',
          fileUrl: otherData.documentUrl || null,
          valid: result.valid,
          status: result.status,
          complianceScore: result.complianceScore,
          fieldsRequired: result.fields.required,
          fieldsPresent: result.fields.present,
          fieldsMissing: result.fields.missing,
          signaturesRequired: result.signatures.required,
          signaturesPresent: result.signatures.present,
          signaturesMissing: result.signatures.missing,
          pageCount: result.pageCount || 0,
          pagesRequired: result.requiredPages || 0,
          missingContent: result.errors,
          errors: result.errors,
          warnings: result.warnings,
          recommendations: result.recommendations,
        },
        include: {
          validator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ...result,
          id: savedValidation.id,
          validatedAt: savedValidation.createdAt,
        },
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Failed to validate document',
      });
    }
  }

  /**
   * POST /api/ai/case-brief
   * Endpoint for Judge to generate case brief
   */
  static async generateCaseBrief(req: Request, res: Response) {
    try {
      const { caseId, caseNumber, caseType } = req.body;
      const userId = (req.user as any)?.id; // From auth middleware

      if (!caseId || !caseNumber || !caseType || !userId) {
        throw new ApiError(
          400,
          'Missing required fields: caseId, caseNumber, caseType'
        );
      }

      // Validate case exists
      const caseExists = await prisma.case.findUnique({
        where: { id: caseId },
      });

      if (!caseExists) {
        throw new ApiError(404, 'Case not found');
      }

      // Call AI service
      const briefRequest: CaseBriefRequest = {
        caseId,
        caseNumber,
        caseType,
      };

      const result = await aiService.generateCaseBrief(briefRequest);

      // Save to database for persistence and history
      const savedBrief = await prisma.caseBrief.create({
        data: {
          caseId,
          generatedBy: userId,
          caseNumber,
          caseType,
          caseOverview: result.brief.overview || {},
          parties: result.brief.parties || {},
          facts: result.brief.facts || {},
          charges: result.brief.charges || [],
          evidenceSummary: result.brief.evidence || {},
          legalIssues: result.brief.legalIssues || [],
          precedents: result.brief.precedents || [],
          prosecutionArguments: result.brief.prosecutionArguments || [],
          defenseArguments: result.brief.defenseArguments || [],
          keyConsiderations: result.brief.keyConsiderations || [],
          timeline: result.brief.timeline || [],
          proceduralStatus: result.brief.procedureStatus || {},
          attentionAreas: result.brief.attentionAreas || [],
        },
        include: {
          generator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          ...result,
          id: savedBrief.id,
          generatedAt: savedBrief.createdAt,
        },
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Failed to generate case brief',
      });
    }
  }

  /**
   * GET /api/ai/case-readiness/:caseId
   * Retrieve case readiness history
   */
  static async getCaseReadinessHistory(req: Request, res: Response) {
    try {
      const { caseId } = req.params;

      const history = await prisma.caseReadinessCheck.findMany({
        where: { caseId },
        include: {
          checker: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 checks
      });

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve case readiness history',
      });
    }
  }

  /**
   * GET /api/ai/document-validations/:caseId
   * Retrieve document validation history
   */
  static async getDocumentValidationHistory(req: Request, res: Response) {
    try {
      const { caseId } = req.params;

      const history = await prisma.documentValidation.findMany({
        where: { caseId },
        include: {
          validator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20, // Last 20 validations
      });

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve document validation history',
      });
    }
  }

  /**
   * GET /api/ai/case-brief/:caseId
   * Retrieve latest case brief
   */
  static async getLatestCaseBrief(req: Request, res: Response) {
    try {
      const { caseId } = req.params;

      const brief = await prisma.caseBrief.findFirst({
        where: { caseId, isArchived: false },
        include: {
          generator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!brief) {
        throw new ApiError(404, 'Case brief not found');
      }

      res.status(200).json({
        success: true,
        data: brief,
      });
    } catch (error) {
      res.status(error instanceof ApiError ? error.statusCode : 500).json({
        success: false,
        error:
          error instanceof ApiError
            ? error.message
            : 'Failed to retrieve case brief',
      });
    }
  }

  /**
   * GET /api/ai/features/health
   * Check AI service health
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const isHealthy = await aiService.healthCheck();

      res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        status: isHealthy ? 'AI service is healthy' : 'AI service is down',
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'AI service is unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }
}
