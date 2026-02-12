import { Router } from 'express';
import { body } from 'express-validator';
import { submitToCourt, intakeCase, createCourtAction, getCourtActions } from './court.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isSHO, isCourtClerk, isJudge, isCourt } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/cases/:caseId/submit-to-court
 * Submit case to court - SHO only
 */
router.post(
  '/cases/:caseId/submit-to-court',
  authenticate,
  isSHO,
  [body('courtId').notEmpty().withMessage('Court ID is required'), validate],
  submitToCourt
);

/**
 * POST /api/cases/:caseId/intake
 * Intake case - COURT_CLERK only
 */
router.post('/cases/:caseId/intake', authenticate, isCourtClerk, intakeCase);

/**
 * POST /api/cases/:caseId/court-actions
 * Create court action - JUDGE only
 */
router.post(
  '/cases/:caseId/court-actions',
  authenticate,
  isJudge,
  [
    body('actionType')
      .isIn([
        'COGNIZANCE',
        'CHARGES_FRAMED',
        'HEARING',
        'JUDGMENT',
        'SENTENCE',
        'ACQUITTAL',
        'CONVICTION',
      ])
      .withMessage('Valid action type is required'),
    body('actionDate').isISO8601().withMessage('Valid action date is required'),
    validate,
  ],
  createCourtAction
);

/**
 * GET /api/cases/:caseId/court-actions
 * List court actions - Court users only
 */
router.get('/cases/:caseId/court-actions', authenticate, isCourt, getCourtActions);

export default router;
