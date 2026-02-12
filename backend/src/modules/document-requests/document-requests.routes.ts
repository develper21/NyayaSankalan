import { Router } from 'express';
import {
  createDocumentRequest,
  getMyRequests,
  getPendingForSho,
  shoApprove,
  rejectRequest,
  getApprovedForCourt,
  issueRequest,
  getByCase,
  createValidator,
  rejectValidator,
  idParamValidator,
  caseIdParamValidator,
  issueValidator,
} from './document-requests.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { isSHO, isPolice, isCourt, allowAll } from '../../middleware/role.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// Police: Create request
router.post('/', authenticate, isPolice, createValidator, createDocumentRequest);

// Police: Get own requests
router.get('/my', authenticate, isPolice, getMyRequests);

// SHO: Get pending approvals
router.get('/pending', authenticate, isSHO, getPendingForSho);

// SHO: Approve
router.post('/:id/approve', authenticate, isSHO, idParamValidator, shoApprove);

// SHO or Court: Reject
router.post('/:id/reject', authenticate, allowAll, idParamValidator, rejectValidator, rejectRequest);

// Court: Get approved list
router.get('/approved', authenticate, isCourt, getApprovedForCourt);

// Public: Get requests by case (police/SHO/court access enforced in service)
router.get('/case/:caseId', authenticate, allowAll, caseIdParamValidator, getByCase);

// Court: Issue (upload PDF)
router.post('/:id/issue', authenticate, isCourt, uploadSingle('file'), idParamValidator, issueRequest);

export default router;