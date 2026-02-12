import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';

export class AuditService {
  async getAuditLogs(caseId: string, organizationId: string | null, userRole: string) {
    // Verify case access
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: { select: { policeStationId: true } },
        courtSubmissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: { courtId: true },
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if ((userRole === 'POLICE' || userRole === 'SHO')) {
      if (caseRecord.fir.policeStationId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }
    }

    if ((userRole === 'COURT_CLERK' || userRole === 'JUDGE')) {
      const latestSubmission = caseRecord.courtSubmissions[0];
      if (!latestSubmission || latestSubmission.courtId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }
    }

    // Get all entity IDs related to this case
    const [evidence, witnesses, documents, accused, events, submissions, actions, bailRecords] = await Promise.all([
      prisma.evidence.findMany({ where: { caseId }, select: { id: true } }),
      prisma.witness.findMany({ where: { caseId }, select: { id: true } }),
      prisma.document.findMany({ where: { caseId }, select: { id: true } }),
      prisma.accused.findMany({ where: { caseId }, select: { id: true } }),
      prisma.investigationEvent.findMany({ where: { caseId }, select: { id: true } }),
      prisma.courtSubmission.findMany({ where: { caseId }, select: { id: true } }),
      prisma.courtAction.findMany({ where: { caseId }, select: { id: true } }),
      prisma.bailRecord.findMany({ where: { caseId }, select: { id: true } }),
    ]);

    const entityIds = [
      caseId,
      ...evidence.map((e) => e.id),
      ...witnesses.map((w) => w.id),
      ...documents.map((d) => d.id),
      ...accused.map((a) => a.id),
      ...events.map((e) => e.id),
      ...submissions.map((s) => s.id),
      ...actions.map((a) => a.id),
      ...bailRecords.map((b) => b.id),
    ];

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: { in: entityIds },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    return auditLogs;
  }
}
