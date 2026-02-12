import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';

interface TimelineEvent {
  type: string;
  timestamp: Date;
  title: string;
  description?: string;
  actor?: string;
}

export class TimelineService {
  async getCaseTimeline(caseId: string, organizationId: string | null, userRole: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: { select: { policeStationId: true, firNumber: true, createdAt: true } },
        state: true,
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

    // Fetch all related data
    const [
      investigationEvents,
      stateHistory,
      documents,
      courtSubmissions,
      courtActions,
      bailRecords,
      evidenceRecords,
    ] = await Promise.all([
      prisma.investigationEvent.findMany({
        where: { caseId },
        include: { user: { select: { name: true } } },
      }),
      prisma.caseStateHistory.findMany({
        where: { caseId },
        include: { user: { select: { name: true } } },
      }),
      prisma.document.findMany({
        where: { caseId },
        include: { user: { select: { name: true } } },
      }),
      prisma.courtSubmission.findMany({
        where: { caseId },
        include: { court: true, user: { select: { name: true } } },
      }),
      prisma.courtAction.findMany({
        where: { caseId },
      }),
      prisma.bailRecord.findMany({
        where: { caseId },
        include: { accused: true },
      }),
      prisma.evidence.findMany({
        where: { caseId },
        include: { user: { select: { name: true } } },
      }),
    ]);

    const timeline: TimelineEvent[] = [];

    // FIR registered
    timeline.push({
      type: 'FIR_REGISTERED',
      timestamp: caseRecord.fir.createdAt,
      title: `FIR Registered: ${caseRecord.fir.firNumber}`,
    });

    // Investigation events
    investigationEvents.forEach((event) => {
      timeline.push({
        type: 'INVESTIGATION_EVENT',
        timestamp: event.eventDate,
        title: `Investigation: ${event.eventType}`,
        description: event.description,
        actor: event.user.name,
      });
    });

    // State changes
    stateHistory.forEach((state) => {
      timeline.push({
        type: 'STATE_CHANGE',
        timestamp: state.changedAt,
        title: `State: ${state.fromState} → ${state.toState}`,
        description: state.changeReason,
        actor: state.user.name,
      });
    });

    // Documents
    documents.forEach((doc) => {
      timeline.push({
        type: 'DOCUMENT',
        timestamp: doc.createdAt,
        title: `Document: ${doc.documentType}`,
        description: `Version ${doc.version} - ${doc.status}`,
        actor: doc.user.name,
      });
    });

    // Court submissions
    courtSubmissions.forEach((sub) => {
      timeline.push({
        type: 'COURT_SUBMISSION',
        timestamp: sub.submittedAt,
        title: `Submitted to Court: ${sub.court.name}`,
        description: `Version ${sub.submissionVersion} - ${sub.status}`,
        actor: sub.user.name,
      });
    });

    // Court actions
    courtActions.forEach((action) => {
      timeline.push({
        type: 'COURT_ACTION',
        timestamp: action.actionDate,
        title: `Court Action: ${action.actionType}`,
      });
    });

    // Bail records
    bailRecords.forEach((bail) => {
      timeline.push({
        type: 'BAIL',
        timestamp: bail.createdAt,
        title: `Bail ${bail.status}: ${bail.accused.name}`,
        description: `Type: ${bail.bailType}`,
      });
    });

    // Evidence records
    evidenceRecords.forEach((evidence) => {
      timeline.push({
        type: 'EVIDENCE',
        timestamp: evidence.uploadedAt,
        title: `Evidence: ${evidence.category}`,
        description: evidence.fileName || 'File uploaded',
        actor: evidence.user.name,
      });
    });

    // Sort by timestamp descending
    timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return timeline;
  }
}
