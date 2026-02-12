import { Request, Response } from 'express';
import { FIRService } from './fir.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  uploadToCloudinary,
  CloudinaryFolder,
  logFileUpload,
} from '../../services/fileUpload.service';
import { AIService } from '../ai/ai.service';

const firService = new FIRService();
const aiService = new AIService();

/**
 * POST /api/firs

  // Best-effort: write FIR extraction to ai-poc storage and index it for demo search
  aiService
    .indexFirExtraction({
      caseId: fir.caseId,
      firNumber: fir.firNumber,
      sectionsApplied: fir.sectionsApplied,
      incidentDate: fir.incidentDate,
      policeStationName: fir.policeStation?.name,
    })
    .catch((err) => console.error('AI FIR indexing error (non-blocking)', err));
 * Create a new FIR (POLICE only)
 * Supports optional file upload for FIR document
 */
export const createFIR = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const userId = req.user.id;
  const organizationId = req.user.organizationId;

  if (!organizationId) {
    throw ApiError.badRequest('Police officer must be associated with a police station');
  }

  let firDocumentUrl: string = req.body.firDocumentUrl || '';

  // Handle file upload if present (defensive: don't block FIR creation on upload failure)
  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(req.file, {
        folder: CloudinaryFolder.FIRS,
      });
      firDocumentUrl = uploadResult.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed (non-blocking):', err);
      // FIR creation continues with empty document URL
      // User can upload document later via edit functionality
    }
  }

  const firData = {
    ...req.body,
    firDocumentUrl,
  };

  const fir = await firService.createFIR(firData, userId, organizationId);

  // Log file upload (only if upload succeeded)
  if (req.file && firDocumentUrl) {
    try {
      await logFileUpload(userId, 'FIR', fir.id, req.file.originalname);
    } catch (err) {
      console.error('File upload logging failed (non-blocking):', err);
    }
  }

  // Best-effort: write FIR extraction to ai-poc storage and index it for demo search
  try {
    aiService
      .indexFirExtraction({
        caseId: fir.caseId,
        firNumber: fir.firNumber,
        sectionsApplied: fir.sectionsApplied,
        incidentDate: fir.incidentDate,
        policeStationName: fir.policeStation?.name,
      })
      .catch((err) => console.error('AI FIR indexing error (non-blocking)', err));
  } catch (err) {
    // Defensive guard: prevent sync errors from blocking FIR creation
    console.error('AI FIR indexing synchronous error (ignored)', err);
  }

  res.status(201).json({
    success: true,
    data: fir,
  });
});

/**
 * GET /api/firs/:firId
 * Get FIR by ID
 */
export const getFIRById = asyncHandler(async (req: Request, res: Response) => {
  const { firId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const organizationId = req.user!.organizationId;

  const fir = await firService.getFIRById(firId, userId, userRole, organizationId);

  res.status(200).json({
    success: true,
    data: fir,
  });
});
