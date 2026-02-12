import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { CaseState, CourtSubmissionStatus, CourtActionType } from '@prisma/client';

export interface SubmitToCourtRequest {
  courtId: string;
}

export interface IntakeRequest {
  acknowledgementNumber?: string;
}

export interface CourtActionRequest {
  actionType: CourtActionType;
  orderFileUrl?: string;
  actionDate: string;
}

export class CourtService {
  /**
   * Submit case to court (Police)
   */
  async submitToCourt(
    caseId: string,
    data: SubmitToCourtRequest,
    userId: string,
    policeStationId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: { select: { policeStationId: true } },
        state: true,
        courtSubmissions: true,
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    // Check case state allows submission
    const allowedStates: CaseState[] = [
      CaseState.INVESTIGATION_COMPLETED,
      CaseState.CHARGE_SHEET_PREPARED,
      CaseState.RESUBMITTED_TO_COURT,
    ];

    if (!caseRecord.state || !allowedStates.includes(caseRecord.state.currentState)) {
      throw ApiError.badRequest(
        `Cannot submit to court from state: ${caseRecord.state?.currentState}`
      );
    }

    const submissionVersion = caseRecord.courtSubmissions.length + 1;

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.courtSubmission.create({
        data: {
          caseId,
          submissionVersion,
          submittedBy: userId,
          courtId: data.courtId,
          status: CourtSubmissionStatus.SUBMITTED,
        },
        include: { court: true },
      });

      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.SUBMITTED_TO_COURT },
      });

      await tx.caseStateHistory.create({
        data: {
          caseId,
          fromState: caseRecord.state!.currentState,
          toState: CaseState.SUBMITTED_TO_COURT,
          changedBy: userId,
          changeReason: 'Submitted to court',
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'SUBMITTED_TO_COURT',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return submission;
    });

    return result;
  }

  /**
   * Intake case (Court)
   */
  async intakeCase(
    caseId: string,
    data: IntakeRequest,
    userId: string,
    courtId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        state: true,
        courtSubmissions: {
          where: { courtId, status: CourtSubmissionStatus.SUBMITTED },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.courtSubmissions.length === 0) {
      throw ApiError.badRequest('No pending submission for this court');
    }

    if (caseRecord.state?.currentState !== CaseState.SUBMITTED_TO_COURT) {
      throw ApiError.badRequest(`Cannot intake case from state: ${caseRecord.state?.currentState}`);
    }

    const submission = caseRecord.courtSubmissions[0];

    const result = await prisma.$transaction(async (tx) => {
      await tx.courtSubmission.update({
        where: { id: submission.id },
        data: { status: CourtSubmissionStatus.ACCEPTED },
      });

      if (data.acknowledgementNumber) {
        await tx.acknowledgement.create({
          data: {
            submissionId: submission.id,
            ackNumber: data.acknowledgementNumber,
            ackTime: new Date(),
          },
        });
      }

      await tx.currentCaseState.update({
        where: { caseId },
        data: { currentState: CaseState.COURT_ACCEPTED },
      });

      await tx.caseStateHistory.create({
        data: {
          caseId,
          fromState: CaseState.SUBMITTED_TO_COURT,
          toState: CaseState.COURT_ACCEPTED,
          changedBy: userId,
          changeReason: 'Case accepted by court',
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'COURT_INTAKE',
          entity: 'CASE',
          entityId: caseId,
        },
      });

      return { caseId, status: 'accepted' };
    });

    return result;
  }

  /**
   * Create court action (Judge)
   */
  async createCourtAction(
    caseId: string,
    data: CourtActionRequest,
    userId: string,
    courtId: string
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        state: true,
        courtSubmissions: {
          where: { courtId, status: CourtSubmissionStatus.ACCEPTED },
          take: 1,
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.courtSubmissions.length === 0) {
      throw ApiError.forbidden('Case is not under this court');
    }

    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.courtAction.create({
        data: {
          caseId,
          actionType: data.actionType,
          orderFileUrl: data.orderFileUrl,
          actionDate: new Date(data.actionDate),
        },
      });

      // Update state based on action type
      let newState: CaseState = caseRecord.state!.currentState;
      if (data.actionType === CourtActionType.COGNIZANCE) {
        newState = CaseState.TRIAL_ONGOING;
      } else if (data.actionType === CourtActionType.JUDGMENT) {
        newState = CaseState.JUDGMENT_RESERVED;
      }

      if (newState !== caseRecord.state!.currentState) {
        await tx.currentCaseState.update({
          where: { caseId },
          data: { currentState: newState },
        });

        await tx.caseStateHistory.create({
          data: {
            caseId,
            fromState: caseRecord.state!.currentState,
            toState: newState,
            changedBy: userId,
            changeReason: `Court action: ${data.actionType}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'COURT_ACTION_CREATED',
          entity: 'COURT_ACTION',
          entityId: action.id,
        },
      });

      return action;
    });

    return result;
  }

  /**
   * Get court actions
   */
  async getCourtActions(caseId: string, courtId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        courtSubmissions: {
          where: { courtId },
          take: 1,
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.courtSubmissions.length === 0) {
      throw ApiError.forbidden('Access denied');
    }

    return prisma.courtAction.findMany({
      where: { caseId },
      orderBy: { actionDate: 'desc' },
    });
  }
}
