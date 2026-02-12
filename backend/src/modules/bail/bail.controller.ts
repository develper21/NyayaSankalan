import { Request, Response } from 'express';
import { BailService } from './bail.service';
import { asyncHandler } from '../../utils/asyncHandler';

const bailService = new BailService();

/**
 * POST /api/cases/:caseId/bail-applications
 */
export const createBailApplication = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;
  const userRole = req.user!.role;

  const bailApp = await bailService.createBailRecord(caseId, req.body, userId, organizationId, userRole);

  res.status(201).json({
    success: true,
    data: bailApp,
  });
});

/**
 * GET /api/cases/:caseId/bail-applications
 */
export const getBailApplications = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const organizationId = req.user!.organizationId;
  const userRole = req.user!.role;

  const bailApps = await bailService.getBailRecords(caseId, organizationId, userRole);

  res.status(200).json({
    success: true,
    data: bailApps,
  });
});
