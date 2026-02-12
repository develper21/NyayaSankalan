import { Request, Response } from 'express';
import { CaseArchiveService } from './case-archive.service';
import { asyncHandler } from '../../utils/asyncHandler';

const caseArchiveService = new CaseArchiveService();

/**
 * POST /api/cases/:caseId/archive
 */
export const archiveCase = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;

  const result = await caseArchiveService.archiveCase(caseId, userId, userRole);

  res.status(200).json({
    success: true,
    data: result,
  });
});
