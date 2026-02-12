import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { BailType, BailStatus } from '@prisma/client';

export interface CreateBailRequest {
  accusedId: string;
  bailType: BailType;
  orderDocumentUrl: string;
}

export interface UpdateBailStatusRequest {
  status: BailStatus;
  orderDocumentUrl?: string;
}

export class BailService {
  private async verifyCaseAccess(caseId: string, organizationId: string | null, userRole: string) {
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

    return caseRecord;
  }

  async createBailRecord(
    caseId: string,
    data: CreateBailRequest,
    userId: string,
    organizationId: string | null,
    userRole: string
  ) {
    await this.verifyCaseAccess(caseId, organizationId, userRole);

    // Verify accused belongs to case
    const accused = await prisma.accused.findFirst({
      where: { id: data.accusedId, caseId },
    });

    if (!accused) {
      throw ApiError.notFound('Accused not found in this case');
    }

    const result = await prisma.$transaction(async (tx) => {
      const bailRecord = await tx.bailRecord.create({
        data: {
          caseId,
          accusedId: data.accusedId,
          bailType: data.bailType,
          status: BailStatus.APPLIED,
          orderDocumentUrl: data.orderDocumentUrl,
        },
        include: { accused: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BAIL_APPLIED',
          entity: 'BAIL_RECORD',
          entityId: bailRecord.id,
        },
      });

      return bailRecord;
    });

    return result;
  }

  async getBailRecords(caseId: string, organizationId: string | null, userRole: string) {
    await this.verifyCaseAccess(caseId, organizationId, userRole);

    return prisma.bailRecord.findMany({
      where: { caseId },
      include: { accused: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBailStatus(
    bailId: string,
    data: UpdateBailStatusRequest,
    userId: string,
    courtId: string
  ) {
    const bailRecord = await prisma.bailRecord.findUnique({
      where: { id: bailId },
      include: {
        case: {
          include: {
            courtSubmissions: {
              where: { courtId },
              take: 1,
            },
          },
        },
      },
    });

    if (!bailRecord) {
      throw ApiError.notFound('Bail record not found');
    }

    if (bailRecord.case.courtSubmissions.length === 0) {
      throw ApiError.forbidden('Access denied');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.bailRecord.update({
        where: { id: bailId },
        data: {
          status: data.status,
          orderDocumentUrl: data.orderDocumentUrl || bailRecord.orderDocumentUrl,
        },
        include: { accused: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: `BAIL_${data.status}`,
          entity: 'BAIL_RECORD',
          entityId: bailId,
        },
      });

      return updated;
    });

    return result;
  }
}
