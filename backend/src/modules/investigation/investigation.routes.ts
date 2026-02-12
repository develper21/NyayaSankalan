import { Router } from 'express';
import { body } from 'express-validator';
import {
  createInvestigationEvent,
  getInvestigationEvents,
  createEvidence,
  getEvidence,
  createWitness,
  getWitnesses,
  createAccused,
  getAccused,
} from './investigation.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isPolice } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

/**
 * Investigation Events
 */
router.post(
  '/cases/:caseId/investigation-events',
  authenticate,
  isPolice,
  [
    body('eventType').notEmpty().withMessage('Event type is required'),
    body('eventDate').isISO8601().withMessage('Valid event date is required'),
    body('description').notEmpty().withMessage('Description is required'),
    validate,
  ],
  createInvestigationEvent
);

router.get('/cases/:caseId/investigation-events', authenticate, isPolice, getInvestigationEvents);

/**
 * Evidence - supports file upload
 */
router.post(
  '/cases/:caseId/evidence',
  authenticate,
  isPolice,
  uploadSingle('file'), // Optional file upload
  [
    body('category')
      .isIn(['PHOTO', 'REPORT', 'FORENSIC', 'STATEMENT'])
      .withMessage('Valid evidence category is required (PHOTO, REPORT, FORENSIC, STATEMENT)'),
    validate,
  ],
  createEvidence
);

router.get('/cases/:caseId/evidence', authenticate, isPolice, getEvidence);

/**
 * Witnesses - supports file upload for statement
 */
router.post(
  '/cases/:caseId/witnesses',
  authenticate,
  isPolice,
  uploadSingle('statementFile'), // Optional statement file upload
  [
    body('name').notEmpty().withMessage('Witness name is required'),
    // statement or statementFile is optional - can be added later
    validate,
  ],
  createWitness
);

router.get('/cases/:caseId/witnesses', authenticate, isPolice, getWitnesses);

/**
 * Accused
 */
router.post(
  '/cases/:caseId/accused',
  authenticate,
  isPolice,
  [
    body('name').notEmpty().withMessage('Accused name is required'),
    body('status')
      .optional()
      .isIn(['ARRESTED', 'ON_BAIL', 'ABSCONDING'])
      .withMessage('Valid accused status is required'),
    validate,
  ],
  createAccused
);

router.get('/cases/:caseId/accused', authenticate, isPolice, getAccused);

export default router;
