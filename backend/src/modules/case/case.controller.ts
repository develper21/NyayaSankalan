import { Request, Response } from 'express';
import { CaseService } from './case.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const caseService = new CaseService();

/**
 * GET /api/cases/my
 * Get cases assigned to current user (POLICE only)
 */
export const getMyCases = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  console.log('=== getMyCases Debug ===');
  console.log('User ID:', userId);
  console.log('User Role:', req.user!.role);

  const result = await caseService.getMyCases(userId, page, limit);

  console.log('Cases found:', result.cases?.length || 0);
  console.log('========================');

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/cases/all
 * Get all cases with filters (SHO/COURT)
 */
export const getAllCases = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with an organization');
  }

  const result = await caseService.getCases(organizationId, userRole, page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/cases/:caseId
 * Get case by ID
 */
export const getCaseById = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  const caseRecord = await caseService.getCaseById(caseId, userRole, organizationId);

  res.status(200).json({
    success: true,
    data: caseRecord,
  });
});

/**
 * POST /api/cases/:caseId/assign
 * Assign case to officer (SHO only)
 */
export const assignCase = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { officerId, assignmentReason } = req.body;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  console.log('=== assignCase Debug ===');
  console.log('Case ID:', caseId);
  console.log('Officer ID (assignedTo):', officerId);
  console.log('Assigned By (SHO ID):', userId);
  console.log('========================');

  if (!organizationId) {
    throw ApiError.badRequest('SHO must be associated with a police station');
  }

  const updatedCase = await caseService.assignCase(
    caseId,
    officerId,
    assignmentReason || 'Assigned by SHO',
    userId,
    organizationId
  );

  res.status(200).json({
    success: true,
    data: updatedCase,
  });
});

/**
 * POST /api/cases/:caseId/complete-investigation
 * Mark investigation as complete (POLICE only)
 */
export const completeInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const result = await caseService.completeInvestigation(caseId, userId, organizationId);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Investigation marked as complete',
  });
});
