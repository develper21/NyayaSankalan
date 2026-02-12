import { Router } from 'express';
import { body } from 'express-validator';
import { createDocument, getDocuments, finalizeDocument } from './document.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isPolice, allowAll } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

/**
 * POST /api/cases/:caseId/documents
 * Create document with file upload - POLICE only
 */
router.post(
  '/cases/:caseId/documents',
  authenticate,
  isPolice,
  uploadSingle('file'), // File upload via multipart/form-data
  [
    body('documentType')
      .isIn([
        'CHARGE_SHEET',
        'EVIDENCE_LIST',
        'WITNESS_LIST',
        'CLOSURE_REPORT',
        'REMAND_APPLICATION',
      ])
      .withMessage('Valid document type is required'),
    body('contentJson').notEmpty().withMessage('Content JSON is required'),
    validate,
  ],
  createDocument
);

/**
 * GET /api/cases/:caseId/documents
 * List documents - all authenticated users
 */
router.get('/cases/:caseId/documents', authenticate, allowAll, getDocuments);

/**
 * POST /api/documents/:documentId/finalize
 * Finalize document - POLICE only
 */
router.post('/documents/:documentId/finalize', authenticate, isPolice, finalizeDocument);

export default router;
