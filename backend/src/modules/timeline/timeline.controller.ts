import { Request, Response } from 'express';
import { TimelineService } from './timeline.service';
import { asyncHandler } from '../../utils/asyncHandler';

const timelineService = new TimelineService();

/**
 * GET /api/cases/:caseId/timeline
 */
export const getCaseTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  
  if (!req.user) {
    throw new Error('Authentication required');
  }
  
  const organizationId = req.user.organizationId;
  const userRole = req.user.role;

  const timeline = await timelineService.getCaseTimeline(caseId, organizationId, userRole);

  res.status(200).json({
    success: true,
    data: timeline,
  });
});
