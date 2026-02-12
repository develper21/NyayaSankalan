import { Request, Response } from 'express';
import { InvestigationService } from './investigation.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  uploadToCloudinary,
  CloudinaryFolder,
  logFileUpload,
  validatePoliceCanUpload,
} from '../../services/fileUpload.service';

const investigationService = new InvestigationService();

/**
 * POST /api/cases/:caseId/investigation-events
 */
export const createInvestigationEvent = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;

  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const event = await investigationService.createInvestigationEvent(
    caseId,
    req.body,
    userId,
    organizationId
  );

  res.status(201).json({
    success: true,
    data: event,
  });
});

/**
 * GET /api/cases/:caseId/investigation-events
 */
export const getInvestigationEvents = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;

  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const organizationId = req.user.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const events = await investigationService.getInvestigationEvents(caseId, organizationId);

  res.status(200).json({
    success: true,
    data: events,
  });
});

/**
 * POST /api/cases/:caseId/evidence
 * Now supports file upload via multipart/form-data
 */
export const createEvidence = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  // Validate police can upload (blocked after court submission)
  await validatePoliceCanUpload(caseId, userRole);

  let fileUrl: string = req.body.fileUrl || '';

  // Handle file upload if present
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, {
      folder: CloudinaryFolder.EVIDENCE,
    });
    fileUrl = uploadResult.secure_url;

    // Log file upload
    await logFileUpload(userId, 'EVIDENCE', caseId, req.file.originalname);
  }

  if (!fileUrl) {
    throw ApiError.badRequest('File URL is required for evidence');
  }

  const evidenceData = {
    category: req.body.category,
    fileUrl,
    fileName: req.file?.originalname,
    mimeType: req.file?.mimetype,
  };

  const evidence = await investigationService.createEvidence(caseId, evidenceData, userId, organizationId);

  res.status(201).json({
    success: true,
    data: evidence,
  });
});

/**
 * GET /api/cases/:caseId/evidence
 */
export const getEvidence = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const evidence = await investigationService.getEvidence(caseId, organizationId);

  res.status(200).json({
    success: true,
    data: evidence,
  });
});

/**
 * POST /api/cases/:caseId/witnesses
 * Now supports file upload via multipart/form-data
 */
export const createWitness = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  // Validate police can upload (blocked after court submission)
  await validatePoliceCanUpload(caseId, userRole);

  let statementFileUrl: string = req.body.statementFileUrl || '';

  // Handle file upload if present
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, {
      folder: CloudinaryFolder.DOCUMENTS,
    });
    statementFileUrl = uploadResult.secure_url;

    // Log file upload
    await logFileUpload(userId, 'WITNESS_STATEMENT', caseId, req.file.originalname);
  }

  // If no file uploaded and no URL, use statement text or default
  if (!statementFileUrl) {
    statementFileUrl = req.body.statement || 'Statement pending';
  }

  const witnessData = {
    name: req.body.name,
    contact: req.body.contact,
    address: req.body.address,
    statementFileUrl,
  };

  const witness = await investigationService.createWitness(caseId, witnessData, userId, organizationId);

  res.status(201).json({
    success: true,
    data: witness,
  });
});

/**
 * GET /api/cases/:caseId/witnesses
 */
export const getWitnesses = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const witnesses = await investigationService.getWitnesses(caseId, organizationId);

  res.status(200).json({
    success: true,
    data: witnesses,
  });
});

/**
 * POST /api/cases/:caseId/accused
 */
export const createAccused = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const accused = await investigationService.createAccused(caseId, req.body, userId, organizationId);

  res.status(201).json({
    success: true,
    data: accused,
  });
});

/**
 * GET /api/cases/:caseId/accused
 */
export const getAccused = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const organizationId = req.user!.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const accused = await investigationService.getAccused(caseId, organizationId);

  res.status(200).json({
    success: true,
    data: accused,
  });
});
