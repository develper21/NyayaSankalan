import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CaseState } from '@prisma/client';
import { ClosureReportService } from '../../services/closureReport.service';

const closureReportService = new ClosureReportService();

export class JudicialClosureService {
  /**
   * Judicial case closure - JUDGE only
   * Closes the case and auto-generates closure report
   */
  async closeCase(caseId: string, judgeUserId: string, courtId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        state: true,
        courtSubmissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    // Verify the case was submitted to this judge's court
    const latestSubmission = caseRecord.courtSubmissions[0];
    if (!latestSubmission || latestSubmission.courtId !== courtId) {
      throw ApiError.forbidden('This case is not assigned to your court');
    }

    if (caseRecord.isArchived) {
      throw ApiError.badRequest('Case is already closed/archived');
    }

    // Case must be in a closable state (DISPOSED or after final judgment)
    const closableStates: CaseState[] = [
      CaseState.DISPOSED,
      CaseState.JUDGMENT_RESERVED,
      CaseState.TRIAL_ONGOING,
      CaseState.COURT_ACCEPTED,
    ];

    const currentState = caseRecord.state?.currentState;
    if (!currentState || !closableStates.includes(currentState)) {
      throw ApiError.badRequest(
        `Case cannot be closed in current state: ${currentState}. ` +
        `Case must be in DISPOSED, JUDGMENT_RESERVED, TRIAL_ONGOING, or COURT_ACCEPTED state.`
      );
    }

    // First, archive the case
    const result = await prisma.$transaction(async (tx) => {
      // Update case to archived
      await tx.case.update({
        where: { id: caseId },
        data: { isArchived: true },
      });

      // Update state to ARCHIVED
      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.ARCHIVED },
      });

      // Add state history
      await tx.caseStateHistory.create({
        data: {
          caseId,
          fromState: caseRecord.state?.currentState || CaseState.DISPOSED,
          toState: CaseState.ARCHIVED,
          changedBy: judgeUserId,
          changeReason: 'Case closed by judicial order',
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: judgeUserId,
          action: 'CASE_CLOSED_BY_JUDGE',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return { caseId, archived: true };
    });

    // Now generate the closure report (outside transaction for Cloudinary upload)
    let reportUrl: string | null = null;
    try {
      reportUrl = await closureReportService.generateClosureReport(caseId, judgeUserId);
    } catch (error) {
      console.error('Failed to generate closure report:', error);
      // Don't fail the closure if report generation fails
      // The report can be generated later manually
    }

    return {
      caseId: result.caseId,
      archived: result.archived,
      closureReportUrl: reportUrl,
      message: reportUrl 
        ? 'Case closed successfully. Closure report generated.'
        : 'Case closed successfully. Closure report generation pending.',
    };
  }

  /**
   * Check if case can be closed by judge
   */
  async canCloseCase(caseId: string, courtId: string): Promise<{ canClose: boolean; reason?: string }> {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        state: true,
        courtSubmissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!caseRecord) {
      return { canClose: false, reason: 'Case not found' };
    }

    const latestSubmission = caseRecord.courtSubmissions[0];
    if (!latestSubmission || latestSubmission.courtId !== courtId) {
      return { canClose: false, reason: 'Case not assigned to your court' };
    }

    if (caseRecord.isArchived) {
      return { canClose: false, reason: 'Case already closed' };
    }

    const closableStates: CaseState[] = [
      CaseState.DISPOSED,
      CaseState.JUDGMENT_RESERVED,
      CaseState.TRIAL_ONGOING,
      CaseState.COURT_ACCEPTED,
    ];

    const caseCurrentState = caseRecord.state?.currentState;
    if (!caseCurrentState || !closableStates.includes(caseCurrentState)) {
      return { 
        canClose: false, 
        reason: `Case in state ${caseCurrentState} cannot be closed` 
      };
    }

    return { canClose: true };
  }
}
