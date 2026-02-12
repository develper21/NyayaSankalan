import { Request, Response } from 'express';
import { DocumentService } from './document.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  uploadToCloudinary,
  CloudinaryFolder,
  logFileUpload,
  validatePoliceCanUpload,
} from '../../services/fileUpload.service';

const documentService = new DocumentService();

/**
 * POST /api/cases/:caseId/documents
 * Now supports file upload via multipart/form-data
 */
export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  // Validate police can upload (blocked after court submission)
  if (userRole === 'POLICE' || userRole === 'SHO') {
    await validatePoliceCanUpload(caseId, userRole);
  }

  // Handle file upload if present
  if (req.file) {
    const folder = CloudinaryFolder.DOCUMENTS;

    const uploadResult = await uploadToCloudinary(req.file, { folder });

    // Log file upload
    await logFileUpload(userId, 'DOCUMENT', caseId, req.file.originalname);
  }

  // Parse contentJson if it's a string
  let contentJson = req.body.contentJson;
  if (typeof contentJson === 'string') {
    try {
      contentJson = JSON.parse(contentJson);
    } catch {
      // Keep as string if not valid JSON
    }
  }

  const documentData = {
    documentType: req.body.documentType,
    contentJson: contentJson || {},
  };

  const document = await documentService.createDocument(
    caseId,
    documentData,
    userId,
    userRole,
    organizationId
  );

  res.status(201).json({
    success: true,
    data: document,
  });
});

/**
 * GET /api/cases/:caseId/documents
 */
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  const documents = await documentService.getDocuments(
    caseId,
    userRole,
    organizationId
  );

  res.status(200).json({
    success: true,
    data: documents,
  });
});

/**
 * POST /api/documents/:documentId/finalize
 */
export const finalizeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const document = await documentService.finalizeDocument(documentId, userId, organizationId);

  res.status(200).json({
    success: true,
    data: document,
  });
});
