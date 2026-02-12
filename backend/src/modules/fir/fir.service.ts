import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { FirSource, CaseState } from '@prisma/client';

export interface CreateFIRRequest {
  firSource?: FirSource;
  incidentDate: string;
  sectionsApplied: string;
  firDocumentUrl?: string;
}

export class FIRService {
  /**
   * Create a new FIR
   * Auto-creates Case and initial CaseState
   * Creates audit log entry
   */
  async createFIR(data: CreateFIRRequest, userId: string, policeStationId: string) {
    const year = new Date().getFullYear();
    const count = await prisma.fir.count({
      where: {
        policeStationId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const firNumber = `FIR/${year}/${(count + 1).toString().padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      const fir = await tx.fir.create({
        data: {
          firNumber,
          firSource: data.firSource || FirSource.POLICE,
          registeredBy: userId,
          policeStationId,
          incidentDate: new Date(data.incidentDate),
          sectionsApplied: data.sectionsApplied,
          firDocumentUrl: data.firDocumentUrl || '',
        },
      });

      const newCase = await tx.case.create({
        data: {
          firId: fir.id,
        },
      });

      await tx.currentCaseState.create({
        data: {
          caseId: newCase.id,
          currentState: CaseState.FIR_REGISTERED,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'FIR_REGISTERED',
          entity: 'FIR',
          entityId: fir.id,
        },
      });

      return { ...fir, caseId: newCase.id };
    });

    return result;
  }

  /**
   * Get FIR by ID
   */
  async getFIRById(firId: string, userId: string, userRole: string, organizationId: string | null) {
    const fir = await prisma.fir.findUnique({
      where: { id: firId },
      include: {
        policeStation: true,
        case: {
          include: {
            state: true,
          },
        },
      },
    });

    if (!fir) {
      throw ApiError.notFound('FIR not found');
    }

    if ((userRole === 'POLICE' || userRole === 'SHO') && fir.policeStationId !== organizationId) {
      throw ApiError.forbidden('Access denied');
    }

    return fir;
  }
}
