import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { isPolice, isJudge } from '../../middleware/role.middleware';
import { requestReopen, getMyRequests, getPendingForJudge, approveRequest, rejectRequest, createValidator, idParamValidator, approveValidator, rejectValidator } from './case-reopen.controller';

const router = Router();

// Police - create request
router.post('/api/cases/:caseId/reopen-request', authenticate, isPolice, createValidator, requestReopen);

// Police - my requests
router.get('/api/case-reopen/my-requests', authenticate, isPolice, getMyRequests);

// Judge - pending
router.get('/api/case-reopen/pending', authenticate, isJudge, getPendingForJudge);

// Judge - approve/reject
router.post('/api/case-reopen/:id/approve', authenticate, isJudge, approveValidator, approveRequest);
router.post('/api/case-reopen/:id/reject', authenticate, isJudge, rejectValidator, rejectRequest);

export default router;
