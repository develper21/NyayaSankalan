import { Request, Response } from 'express';
import { CourtService } from './court.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const courtService = new CourtService();

/**
 * POST /api/cases/:caseId/submit-to-court
 */
export const submitToCourt = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('SHO must be associated with a police station');
  }

  const result = await courtService.submitToCourt(caseId, req.body, userId, organizationId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * POST /api/cases/:caseId/intake
 */
export const intakeCase = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('Court clerk must be associated with a court');
  }

  const result = await courtService.intakeCase(caseId, req.body, userId, organizationId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * POST /api/cases/:caseId/court-actions
 */
export const createCourtAction = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('Judge must be associated with a court');
  }

  const action = await courtService.createCourtAction(caseId, req.body, userId, organizationId);

  res.status(201).json({
    success: true,
    data: action,
  });
});

/**
 * GET /api/cases/:caseId/court-actions
 */
export const getCourtActions = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a court');
  }

  const actions = await courtService.getCourtActions(caseId, organizationId);

  res.status(200).json({
    success: true,
    data: actions,
  });
});
