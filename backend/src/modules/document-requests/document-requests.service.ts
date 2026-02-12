import { prisma } from '../../prisma/client';
import { ApiError } from '../../utils/ApiError';
import { DocumentRequestStatus, DocumentRequestType } from '@prisma/client';
import fileUploadService, { CloudinaryFolder } from '../../services/fileUpload.service';

export interface CreateDocumentRequestPayload {
  caseId: string;
  documentType: DocumentRequestType;
  requestReason: string;
}

export class DocumentRequestService {
  private async verifyCaseExists(caseId: string) {
    const caseRecord = await prisma.case.findUnique({ where: { id: caseId }, include: { fir: true } });
    if (!caseRecord) throw ApiError.notFound('Case not found');
    return caseRecord;
  }

  private async verifyAssignedToUser(caseId: string, userId: string) {
    const assignment = await prisma.caseAssignment.findFirst({
      where: { caseId, assignedTo: userId, unassignedAt: null },
    });

    if (!assignment) throw ApiError.forbidden('Case is not assigned to you');
  }

  async createRequest(payload: CreateDocumentRequestPayload, userId: string) {
    const caseRecord = await this.verifyCaseExists(payload.caseId);

    // Police can create only if case is assigned to them
    await this.verifyAssignedToUser(payload.caseId, userId);

    const result = await prisma.$transaction(async (tx) => {
      const req = await tx.documentRequest.create({
        data: {
          caseId: payload.caseId,
          requestedBy: userId,
          documentType: payload.documentType,
          status: DocumentRequestStatus.REQUESTED,
          requestReason: payload.requestReason,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DOCUMENT_REQUEST_CREATED',
          entity: 'DOCUMENT_REQUEST',
          entityId: req.id,
        },
      });

      return req;
    });

    return result;
  }

  async getMyRequests(userId: string) {
    return prisma.documentRequest.findMany({
      where: { requestedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verify access to a case for different roles and optionally user
   */
  private async verifyCaseAccess(caseId: string, organizationId: string | null, userRole: string, userId?: string) {
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        fir: true,
        assignments: { where: { unassignedAt: null }, select: { assignedTo: true } },
        courtSubmissions: { orderBy: { submittedAt: 'desc' }, take: 1, select: { courtId: true } },
      },
    });

    if (!caseRecord) throw ApiError.notFound('Case not found');

    // Police and SHO access (must belong to same police station)
    if (userRole === 'POLICE' || userRole === 'SHO') {
      if (caseRecord.fir.policeStationId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }

      // Police can only access if assigned to them
      if (userRole === 'POLICE') {
        const isAssigned = caseRecord.assignments.some((a) => a.assignedTo === userId);
        if (!isAssigned) {
          throw ApiError.forbidden('Access denied');
        }
      }
    }

    // Court users must belong to the court where case is submitted
    if (userRole === 'COURT_CLERK' || userRole === 'JUDGE') {
      const latestSubmission = caseRecord.courtSubmissions[0];
      if (!latestSubmission || latestSubmission.courtId !== organizationId) {
        throw ApiError.forbidden('Access denied');
      }
    }

    return caseRecord;
  }

  /**
   * Get all document requests for a specific case with access checks
   */
  async getRequestsByCase(caseId: string, userId: string, organizationId: string | null, userRole: string) {
    await this.verifyCaseAccess(caseId, organizationId, userRole, userId);

    return prisma.documentRequest.findMany({
      where: { caseId },
      include: { requester: true, approver: true, issuer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingForSho(organizationId: string) {
    // SHO sees requests for cases from their police station
    return prisma.documentRequest.findMany({
      where: { status: DocumentRequestStatus.REQUESTED, case: { fir: { policeStationId: organizationId } } },
      include: { case: { include: { fir: true } }, requester: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async shoApprove(requestId: string, shoUserId: string, organizationId: string) {
    const req = await prisma.documentRequest.findUnique({ where: { id: requestId }, include: { case: { include: { fir: true } } } });
    if (!req) throw ApiError.notFound('Document request not found');
    if (req.status !== DocumentRequestStatus.REQUESTED) throw ApiError.forbidden('Request is not in requested state');
    // SHO can approve only if same police station
    if (req.case.fir.policeStationId !== organizationId) throw ApiError.forbidden('Access denied');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRequest.update({ where: { id: requestId }, data: { status: DocumentRequestStatus.SHO_APPROVED, approvedBy: shoUserId } });
      await tx.auditLog.create({ data: { userId: shoUserId, action: 'DOCUMENT_REQUEST_APPROVED', entity: 'DOCUMENT_REQUEST', entityId: requestId } });
      return updated;
    });

    return result;
  }

  async reject(requestId: string, userId: string, role: string, reason: string, organizationId?: string) {
    const req = await prisma.documentRequest.findUnique({ where: { id: requestId }, include: { case: { include: { fir: true } } } });
    if (!req) throw ApiError.notFound('Document request not found');

    // SHO rejection - must be same police station and request in REQUESTED
    if (role === 'SHO') {
      if (req.case.fir.policeStationId !== organizationId) throw ApiError.forbidden('Access denied');
      if (req.status !== DocumentRequestStatus.REQUESTED) throw ApiError.forbidden('Request is not in requested state');
    }

    // Court rejection - only allowed after SHO approval
    if ((role === 'COURT_CLERK' || role === 'JUDGE')) {
      if (req.status !== DocumentRequestStatus.SHO_APPROVED) throw ApiError.forbidden('Request not approved by SHO');
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRequest.update({ where: { id: requestId }, data: { status: DocumentRequestStatus.REJECTED, remarks: reason } });
      await tx.auditLog.create({ data: { userId, action: 'DOCUMENT_REQUEST_REJECTED', entity: 'DOCUMENT_REQUEST', entityId: requestId } });
      return updated;
    });

    return result;
  }

  async getApprovedForCourt() {
    return prisma.documentRequest.findMany({ where: { status: DocumentRequestStatus.SHO_APPROVED }, include: { case: { include: { fir: true } }, requester: true }, orderBy: { createdAt: 'desc' } });
  }

  async issue(requestId: string, file: Express.Multer.File, userId: string, remarks?: string) {
    const req = await prisma.documentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw ApiError.notFound('Document request not found');
    if (req.status !== DocumentRequestStatus.SHO_APPROVED) throw ApiError.forbidden('Request has not been approved by SHO');

    // Upload file to Cloudinary under court orders
    const upload = await fileUploadService.uploadToCloudinary(file, { folder: CloudinaryFolder.COURT_ORDERS });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.documentRequest.update({ where: { id: requestId }, data: { status: DocumentRequestStatus.ISSUED, issuedBy: userId, issuedFileUrl: upload.secure_url, remarks } });
      await tx.auditLog.create({ data: { userId, action: 'DOCUMENT_REQUEST_ISSUED', entity: 'DOCUMENT_REQUEST', entityId: requestId } });
      await fileUploadService.logFileUpload(userId, 'DOCUMENT_REQUEST', requestId, file.originalname, 'UPLOAD');
      return updated;
    });

    return result;
  }
}

export default new DocumentRequestService();