import { Router } from 'express';
import { AIFeaturesController } from './features.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all AI features routes
router.use(authenticate);

/**
 * CASE READINESS CHECKS (SHO)
 */
router.post(
  '/case-readiness',
  requireRole(UserRole.SHO),
  AIFeaturesController.checkCaseReadiness
);

router.get(
  '/case-readiness/:caseId',
  AIFeaturesController.getCaseReadinessHistory
);

/**
 * DOCUMENT VALIDATIONS (CLERK)
 */
router.post(
  '/document-validate',
  requireRole(UserRole.COURT_CLERK),
  AIFeaturesController.validateDocument
);

router.get(
  '/document-validations/:caseId',
  AIFeaturesController.getDocumentValidationHistory
);

/**
 * CASE BRIEFS (JUDGE)
 */
router.post(
  '/case-brief',
  requireRole(UserRole.JUDGE),
  AIFeaturesController.generateCaseBrief
);

router.get(
  '/case-brief/:caseId',
  AIFeaturesController.getLatestCaseBrief
);

/**
 * HEALTH CHECK
 */
router.get(
  '/features/health',
  AIFeaturesController.healthCheck
);

export default router;
