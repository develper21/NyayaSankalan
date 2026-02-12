import { Request, Response } from 'express';
import { ClosureReportService } from '../../services/closureReport.service';
import { asyncHandler } from '../../utils/asyncHandler';

const closureReportService = new ClosureReportService();

/**
 * POST /api/cases/:caseId/closure-report
 * Generate closure report for archived case
 */
export const generateClosureReport = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;

  const reportUrl = await closureReportService.generateClosureReport(caseId, userId);

  res.status(200).json({
    success: true,
    message: 'Closure report generated successfully',
    data: { reportUrl },
  });
});

/**
 * GET /api/cases/:caseId/closure-report
 * Get closure report URL
 */
export const getClosureReport = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;

  const reportUrl = await closureReportService.getClosureReport(caseId);

  res.status(200).json({
    success: true,
    data: { reportUrl },
  });
});
