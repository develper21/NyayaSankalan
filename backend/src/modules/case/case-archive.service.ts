import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CaseState } from '@prisma/client';

export class CaseArchiveService {
  /**
   * Archive a case
   */
  async archiveCase(caseId: string, userId: string, policeStationId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { fir: true, state: true },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    if (caseRecord.isArchived) {
      throw ApiError.badRequest('Case is already archived');
    }

    // Only disposed cases can be archived
    if (caseRecord.state?.currentState !== CaseState.DISPOSED) {
      throw ApiError.badRequest('Only disposed cases can be archived');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.case.update({
        where: { id: caseId },
        data: { isArchived: true },
      });

      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.ARCHIVED },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CASE_ARCHIVED',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return { caseId, archived: true };
    });

    return result;
  }

  /**
   * Restore archived case
   */
  async restoreCase(caseId: string, userId: string, policeStationId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { fir: true },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    if (!caseRecord.isArchived) {
      throw ApiError.badRequest('Case is not archived');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.case.update({
        where: { id: caseId },
        data: { isArchived: false },
      });

      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.DISPOSED },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CASE_RESTORED',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return { caseId, archived: false };
    });

    return result;
  }
}
