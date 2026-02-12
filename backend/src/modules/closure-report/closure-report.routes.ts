import { Router } from 'express';
import { generateClosureReport, getClosureReport } from './closure-report.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/cases/:caseId/closure-report
 * Generate closure report (any authenticated user can trigger)
 */
router.post('/cases/:caseId/closure-report', authenticate, generateClosureReport);

/**
 * GET /api/cases/:caseId/closure-report
 * Get closure report URL
 */
router.get('/cases/:caseId/closure-report', authenticate, getClosureReport);

export default router;
