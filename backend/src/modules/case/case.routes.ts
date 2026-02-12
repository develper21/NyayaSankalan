import { Router } from 'express';
import { body } from 'express-validator';
import { getMyCases, getAllCases, getCaseById, assignCase, completeInvestigation } from './case.controller';
import { archiveCase } from './case-archive.controller';
import { judicialCloseCase, canCloseCase } from './judicial-closure.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isPolice, requireRole, isSHO, allowAll, isJudge } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /api/cases/my
 * Get cases assigned to current user - POLICE/SHO
 */
router.get('/my', authenticate, isPolice, getMyCases);

/**
 * GET /api/cases/all
 * Get all cases with filters - SHO/COURT
 */
router.get(
  '/all',
  authenticate,
  requireRole(UserRole.SHO, UserRole.COURT_CLERK, UserRole.JUDGE),
  getAllCases
);

/**
 * GET /api/cases/:caseId
 * Get case by ID - all authenticated users
 */
router.get('/:caseId', authenticate, allowAll, getCaseById);

/**
 * POST /api/cases/:caseId/assign
 * Assign case to officer - SHO only
 */
router.post(
  '/:caseId/assign',
  authenticate,
  isSHO,
  [body('officerId').notEmpty().withMessage('Officer ID is required'), validate],
  assignCase
);

/**
 * POST /api/cases/:caseId/complete-investigation
 * Mark investigation as complete - POLICE only (must be assigned to case)
 */
router.post(
  '/:caseId/complete-investigation',
  authenticate,
  isPolice,
  completeInvestigation
);

/**
 * POST /api/cases/:caseId/archive
 * Archive case - SHO/JUDGE only
 */
router.post(
  '/:caseId/archive',
  authenticate,
  requireRole(UserRole.SHO, UserRole.JUDGE),
  archiveCase
);

/**
 * POST /api/cases/:caseId/judicial-close
 * Judicial case closure - JUDGE only
 * Archives case and auto-generates closure report
 */
router.post(
  '/:caseId/judicial-close',
  authenticate,
  isJudge,
  judicialCloseCase
);

/**
 * GET /api/cases/:caseId/can-close
 * Check if case can be closed - JUDGE only
 */
router.get(
  '/:caseId/can-close',
  authenticate,
  isJudge,
  canCloseCase
);

export default router;
