import { Request, Response } from 'express';
import { JudicialClosureService } from './judicial-closure.service';
import { asyncHandler } from '../../utils/asyncHandler';

const judicialClosureService = new JudicialClosureService();

/**
 * POST /api/cases/:caseId/judicial-close
 * Close case by judicial order (JUDGE only)
 */
export const judicialCloseCase = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const courtId = req.user!.organizationId;

  const result = await judicialClosureService.closeCase(caseId, userId, courtId!);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      caseId: result.caseId,
      archived: result.archived,
      closureReportUrl: result.closureReportUrl,
    },
  });
});

/**
 * GET /api/cases/:caseId/can-close
 * Check if case can be closed by judge
 */
export const canCloseCase = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const courtId = req.user!.organizationId;

  const result = await judicialClosureService.canCloseCase(caseId, courtId!);

  res.status(200).json({
    success: true,
    data: result,
  });
});
