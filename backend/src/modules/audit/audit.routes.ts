import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /api/cases/:caseId/audit-logs
 * Get audit logs - POLICE/SHO/COURT can access (for notifications)
 */
router.get(
  '/cases/:caseId/audit-logs',
  authenticate,
  requireRole(UserRole.POLICE, UserRole.SHO, UserRole.COURT_CLERK, UserRole.JUDGE),
  getAuditLogs
);

export default router;
