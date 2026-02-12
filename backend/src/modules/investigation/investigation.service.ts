import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { InvestigationEventType, EvidenceCategory, AccusedStatus } from '@prisma/client';

export interface CreateInvestigationEventRequest {
  eventType: InvestigationEventType;
  eventDate: string;
  description: string;
}

export interface CreateEvidenceRequest {
  category: EvidenceCategory;
  fileUrl: string;
}

export interface CreateWitnessRequest {
  name: string;
  contact?: string;
  address?: string;
  statementFileUrl: string;
}

export interface CreateAccusedRequest {
  name: string;
  status?: AccusedStatus;
}

export class InvestigationService {
  private async verifyCaseAccess(caseId: string, policeStationId: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: {
          select: { policeStationId: true },
        },
      },
    });

    if (!caseRecord) {
      throw ApiError.notFound('Case not found');
    }

    if (caseRecord.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    return caseRecord;
  }

  async createInvestigationEvent(
    caseId: string,
    data: CreateInvestigationEventRequest,
    userId: string,
    policeStationId: string
  ) {
    await this.verifyCaseAccess(caseId, policeStationId);

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.investigationEvent.create({
        data: {
          caseId,
          eventType: data.eventType,
          eventDate: new Date(data.eventDate),
          description: data.description,
          performedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'INVESTIGATION_EVENT_CREATED',
          entity: 'INVESTIGATION_EVENT',
          entityId: newEvent.id,
        },
      });

      return newEvent;
    });

    return event;
  }

  async getInvestigationEvents(caseId: string, policeStationId: string) {
    await this.verifyCaseAccess(caseId, policeStationId);

    return prisma.investigationEvent.findMany({
      where: { caseId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async createEvidence(
    caseId: string,
    data: CreateEvidenceRequest,
    userId: string,
    policeStationId: string
  ) {
    await this.verifyCaseAccess(caseId, policeStationId);

    const evidence = await prisma.$transaction(async (tx) => {
      const newEvidence = await tx.evidence.create({
        data: {
          caseId,
          category: data.category,
          fileUrl: data.fileUrl,
          uploadedBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'EVIDENCE_ADDED',
          entity: 'EVIDENCE',
          entityId: newEvidence.id,
        },
      });

      return newEvidence;
    });

    return evidence;
  }

  async getEvidence(caseId: string, policeStationId: string) {
    await this.verifyCaseAccess(caseId, policeStationId);

    return prisma.evidence.findMany({
      where: { caseId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async createWitness(
    caseId: string,
    data: CreateWitnessRequest,
    userId: string,
    policeStationId: string
  ) {
    await this.verifyCaseAccess(caseId, policeStationId);

    const witness = await prisma.$transaction(async (tx) => {
      const newWitness = await tx.witness.create({
        data: {
          caseId,
          name: data.name,
          contact: data.contact,
          address: data.address,
          statementFileUrl: data.statementFileUrl,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'WITNESS_ADDED',
          entity: 'WITNESS',
          entityId: newWitness.id,
        },
      });

      return newWitness;
    });

    return witness;
  }

  async getWitnesses(caseId: string, policeStationId: string) {
    await this.verifyCaseAccess(caseId, policeStationId);

    return prisma.witness.findMany({
      where: { caseId },
    });
  }

  async createAccused(
    caseId: string,
    data: CreateAccusedRequest,
    userId: string,
    policeStationId: string
  ) {
    await this.verifyCaseAccess(caseId, policeStationId);

    const accused = await prisma.$transaction(async (tx) => {
      const newAccused = await tx.accused.create({
        data: {
          caseId,
          name: data.name,
          status: data.status || AccusedStatus.ARRESTED,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCUSED_ADDED',
          entity: 'ACCUSED',
          entityId: newAccused.id,
        },
      });

      return newAccused;
    });

    return accused;
  }

  async getAccused(caseId: string, policeStationId: string) {
    await this.verifyCaseAccess(caseId, policeStationId);

    return prisma.accused.findMany({
      where: { caseId },
      include: { bailRecords: true },
    });
  }
}
