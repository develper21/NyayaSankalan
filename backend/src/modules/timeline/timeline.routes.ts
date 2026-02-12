import { Router } from 'express';
import { getCaseTimeline } from './timeline.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { allowAll } from '../../middleware/role.middleware';

const router = Router();

/**
 * GET /api/cases/:caseId/timeline
 * Get case timeline - all authenticated users
 */
router.get('/cases/:caseId/timeline', authenticate, allowAll, getCaseTimeline);

export default router;
