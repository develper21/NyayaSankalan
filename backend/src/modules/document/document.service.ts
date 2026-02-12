import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { DocumentType, DocumentStatus, CaseState } from '@prisma/client';

export interface CreateDocumentRequest {
  documentType: DocumentType;
  contentJson: any;
  filePath?: string; // Optional for Cloudinary URL
}

export class DocumentService {
  private async verifyCaseAccess(
    caseId: string,
    userRole: string,
    organizationId: string | null
  ) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: { select: { policeStationId: true } },
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

    // Police access
    if ((userRole === 'POLICE' || userRole === 'SHO')) {
      if (caseRecord.fir.policeStationId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }
    }

    // Court access
    if ((userRole === 'COURT_CLERK' || userRole === 'JUDGE')) {
      const latestSubmission = caseRecord.courtSubmissions[0];
      if (!latestSubmission || latestSubmission.courtId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }
    }

    return caseRecord;
  }

  async createDocument(
    caseId: string,
    data: CreateDocumentRequest,
    userId: string,
    userRole: string,
    organizationId: string | null
  ) {
    const caseRecord = await this.verifyCaseAccess(caseId, userRole, organizationId);

    // Check if documents are locked (submitted to court)
    const lockedStates: CaseState[] = [
      CaseState.SUBMITTED_TO_COURT,
      CaseState.COURT_ACCEPTED,
      CaseState.TRIAL_ONGOING,
      CaseState.JUDGMENT_RESERVED,
      CaseState.DISPOSED,
      CaseState.ARCHIVED,
    ];

    if (caseRecord.state && lockedStates.includes(caseRecord.state.currentState)) {
      throw ApiError.forbidden('Cannot create documents - case has been submitted to court');
    }

    // Get latest version
    const latestDoc = await prisma.document.findFirst({
      where: { caseId, documentType: data.documentType },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = (latestDoc?.version || 0) + 1;

    const document = await prisma.$transaction(async (tx) => {
      const newDoc = await tx.document.create({
        data: {
          caseId,
          documentType: data.documentType,
          version,
          status: DocumentStatus.DRAFT,
          contentJson: data.contentJson,
          createdBy: userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_CREATED',
          entity: 'DOCUMENT',
          entityId: newDoc.id,
        },
      });

      return newDoc;
    });

    return document;
  }

  async getDocuments(
    caseId: string,
    userRole: string,
    organizationId: string | null
  ) {
    await this.verifyCaseAccess(caseId, userRole, organizationId);

    return prisma.document.findMany({
      where: { caseId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
    });
  }

  async finalizeDocument(documentId: string, userId: string, policeStationId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          include: {
            fir: { select: { policeStationId: true } },
            state: true,
          },
        },
      },
    });

    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    if (document.case.fir.policeStationId !== policeStationId) {
      throw ApiError.forbidden('Access denied');
    }

    if (document.status === DocumentStatus.FINAL || document.status === DocumentStatus.LOCKED) {
      throw ApiError.badRequest('Document is already finalized');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FINAL },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_FINALIZED',
          entity: 'DOCUMENT',
          entityId: documentId,
        },
      });

      return updated;
    });

    return result;
  }
}
