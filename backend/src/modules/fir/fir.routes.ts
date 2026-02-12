import { Router } from 'express';
import { body } from 'express-validator';
import { createFIR, getFIRById } from './fir.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isPolice, allowAll } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

/**
 * POST /api/firs
 * Create new FIR with optional file upload - POLICE only
 */
router.post(
  '/',
  authenticate,
  isPolice,
  uploadSingle('file'), // Optional FIR document upload
  [
    body('incidentDate').isISO8601().withMessage('Valid incident date is required'),
    body('sectionsApplied').notEmpty().withMessage('Sections applied is required'),
    body('firSource')
      .optional()
      .isIn(['POLICE', 'COURT_ORDER'])
      .withMessage('Valid FIR source is required'),
    validate,
  ],
  createFIR
);

/**
 * GET /api/firs/:firId
 * Get FIR by ID - all authenticated users
 */
router.get('/:firId', authenticate, allowAll, getFIRById);

export default router;
