import { Router } from 'express';
import { body } from 'express-validator';
import { createBailApplication, getBailApplications } from './bail.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { allowAll } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/cases/:caseId/bail-applications
 * Create bail application - all authenticated users
 */
router.post(
  '/cases/:caseId/bail-applications',
  authenticate,
  allowAll,
  [
    body('applicantName').notEmpty().withMessage('Applicant name is required'),
    body('applicantRelation').notEmpty().withMessage('Applicant relation is required'),
    body('grounds').notEmpty().withMessage('Grounds for bail is required'),
    validate,
  ],
  createBailApplication
);

/**
 * GET /api/cases/:caseId/bail-applications
 * List bail applications - all authenticated users
 */
router.get('/cases/:caseId/bail-applications', authenticate, allowAll, getBailApplications);

export default router;
