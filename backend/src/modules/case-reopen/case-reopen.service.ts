import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CaseReopenStatus, CaseState } from '@prisma/client';

export class CaseReopenService {
  private async verifyCaseExists(caseId: string) {
    const caseRecord = await prisma.case.findUnique({ where: { id: caseId }, include: { fir: true, state: true, assignments: { orderBy: { assignedAt: 'desc' }, take: 1 } } });
    if (!caseRecord) throw ApiError.notFound('Case not found');
    return caseRecord;
  }

  private async verifyAssignedToUser(caseId: string, userId: string) {
    const assignment = await prisma.caseAssignment.findFirst({ where: { caseId, assignedTo: userId, unassignedAt: null } });
    if (!assignment) throw ApiError.forbidden('Case is not assigned to you');
  }

  async requestReopen(caseId: string, userId: string) {
    const caseRecord = await this.verifyCaseExists(caseId);

    // Only archived cases allowed
    if (!caseRecord.isArchived || caseRecord.state?.currentState !== CaseState.ARCHIVED) {
      throw ApiError.badRequest('Case is not archived');
    }

    // Police must be assigned to the case
    await this.verifyAssignedToUser(caseId, userId);

    // No duplicate active requests
    const existing = await prisma.caseReopenRequest.findFirst({ where: { caseId, status: CaseReopenStatus.REQUESTED } });
    if (existing) throw ApiError.badRequest('There is already a pending reopen request for this case');

    const result = await prisma.$transaction(async (tx) => {
      const req = await tx.caseReopenRequest.create({ data: { caseId, requestedBy: userId, status: CaseReopenStatus.REQUESTED, policeReason: '' } });

      await tx.auditLog.create({ data: { userId, action: 'CASE_REOPEN_REQUESTED', entity: 'CASE_REOPEN_REQUEST', entityId: req.id } });

      return req;
    });

    return result;
  }

  async createRequestWithReason(caseId: string, userId: string, policeReason: string) {
    const caseRecord = await this.verifyCaseExists(caseId);

    if (!caseRecord.isArchived || caseRecord.state?.currentState !== CaseState.ARCHIVED) {
      throw ApiError.badRequest('Case is not archived');
    }

    await this.verifyAssignedToUser(caseId, userId);

    const existing = await prisma.caseReopenRequest.findFirst({ where: { caseId, status: CaseReopenStatus.REQUESTED } });
    if (existing) throw ApiError.badRequest('There is already a pending reopen request for this case');

    const result = await prisma.$transaction(async (tx) => {
      const req = await tx.caseReopenRequest.create({ data: { caseId, requestedBy: userId, status: CaseReopenStatus.REQUESTED, policeReason } });

      await tx.auditLog.create({ data: { userId, action: 'CASE_REOPEN_REQUESTED', entity: 'CASE_REOPEN_REQUEST', entityId: req.id } });

      return req;
    });

    return result;
  }

  async getMyRequests(userId: string) {
    return prisma.caseReopenRequest.findMany({ where: { requestedBy: userId }, orderBy: { createdAt: 'desc' } });
  }

  async getPendingForJudge(organizationId: string) {
    // Judges see requests for cases that were submitted to their court (match court id)
    return prisma.caseReopenRequest.findMany({ where: { status: CaseReopenStatus.REQUESTED, case: { courtSubmissions: { some: { courtId: organizationId } } } }, include: { case: { include: { fir: true, courtSubmissions: { orderBy: { submittedAt: 'desc' }, take: 1 } } }, requester: true }, orderBy: { createdAt: 'desc' } });
  }

  async approve(requestId: string, judgeId: string, judgeNote: string, organizationId: string) {
    const req = await prisma.caseReopenRequest.findUnique({ where: { id: requestId }, include: { case: { include: { fir: true, assignments: { orderBy: { assignedAt: 'desc' }, take: 1 }, courtSubmissions: { orderBy: { submittedAt: 'desc' }, take: 1 } } }, requester: true } });
    if (!req) throw ApiError.notFound('Request not found');
    if (req.status !== CaseReopenStatus.REQUESTED) throw ApiError.forbidden('Request is not in requested state');

    // Judge can approve only if case was submitted to their court - check latest submission
    const latestSubmission = req.case.courtSubmissions[0];
    if (!latestSubmission || latestSubmission.courtId !== organizationId) throw ApiError.forbidden('Access denied');

    const result = await prisma.$transaction(async (tx) => {
      // Update request
      const updatedRequest = await tx.caseReopenRequest.update({ where: { id: requestId }, data: { status: CaseReopenStatus.APPROVED, reviewedBy: judgeId, judgeNote, decidedAt: new Date() } });

      // Unarchive and set state to UNDER_INVESTIGATION
      await tx.case.update({ where: { id: req.caseId }, data: { isArchived: false } });

      await tx.currentCaseState.upsert({ where: { caseId: req.caseId }, update: { currentState: CaseState.UNDER_INVESTIGATION }, create: { caseId: req.caseId, currentState: CaseState.UNDER_INVESTIGATION } });

      await tx.caseStateHistory.create({ data: { caseId: req.caseId, fromState: CaseState.ARCHIVED, toState: CaseState.UNDER_INVESTIGATION, changedBy: judgeId, changeReason: 'Re-opened by court' } });

      // Auto-assign to original officer (most recent assignment)
      const lastAssignment = req.case.assignments[0];
      if (lastAssignment) {
        // Unassign existing
        await tx.caseAssignment.updateMany({ where: { caseId: req.caseId, unassignedAt: null }, data: { unassignedAt: new Date() } });

        await tx.caseAssignment.create({ data: { caseId: req.caseId, assignedTo: lastAssignment.assignedTo, assignedBy: judgeId, assignmentReason: 'Re-opened by court' } });

        await tx.auditLog.create({ data: { userId: judgeId, action: 'CASE_ASSIGNED', entity: 'CASE', entityId: req.caseId } });
      }

      await tx.auditLog.create({ data: { userId: judgeId, action: 'CASE_REOPEN_APPROVED', entity: 'CASE_REOPEN_REQUEST', entityId: requestId } });
      await tx.auditLog.create({ data: { userId: judgeId, action: 'CASE_REOPENED', entity: 'CASE', entityId: req.caseId } });

      return updatedRequest;
    });

    return result;
  }

  async reject(requestId: string, judgeId: string, reason: string, organizationId: string) {
    const req = await prisma.caseReopenRequest.findUnique({ where: { id: requestId }, include: { case: { include: { courtSubmissions: { orderBy: { submittedAt: 'desc' }, take: 1 } } } } });
    if (!req) throw ApiError.notFound('Request not found');
    if (req.status !== CaseReopenStatus.REQUESTED) throw ApiError.forbidden('Request is not in requested state');

    const latestSubmission = req.case.courtSubmissions[0];
    if (!latestSubmission || latestSubmission.courtId !== organizationId) throw ApiError.forbidden('Access denied');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.caseReopenRequest.update({ where: { id: requestId }, data: { status: CaseReopenStatus.REJECTED, reviewedBy: judgeId, judgeNote: reason, decidedAt: new Date() } });
      await tx.auditLog.create({ data: { userId: judgeId, action: 'CASE_REOPEN_REJECTED', entity: 'CASE_REOPEN_REQUEST', entityId: requestId } });
      return updated;
    });

    return result;
  }
}

export default new CaseReopenService();
