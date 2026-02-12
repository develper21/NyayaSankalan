import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import documentRequestService from './document-requests.service';
import { validate } from '../../middleware/validation.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import { ApiError } from '../../utils/ApiError';

export const createDocumentRequest = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { caseId, documentType, requestReason } = req.body;
  const result = await documentRequestService.createRequest({ caseId, documentType, requestReason }, userId);
  res.status(201).json({ success: true, data: result });
};

export const getMyRequests = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await documentRequestService.getMyRequests(userId);
  res.status(200).json({ success: true, data: result });
};

export const getPendingForSho = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;
  const result = await documentRequestService.getPendingForSho(organizationId);
  res.status(200).json({ success: true, data: result });
};

export const shoApprove = async (req: Request, res: Response) => {
  const id = req.params.id;
  const shoUserId = req.user!.id;
  const organizationId = req.user!.organizationId;
  const result = await documentRequestService.shoApprove(id, shoUserId, organizationId);
  res.status(200).json({ success: true, data: result });
};

export const rejectRequest = async (req: Request, res: Response) => {
  const id = req.params.id;
  const { reason } = req.body;
  const userId = req.user!.id;
  const role = req.user!.role;
  const organizationId = req.user!.organizationId;
  const result = await documentRequestService.reject(id, userId, role, reason, organizationId);
  res.status(200).json({ success: true, data: result });
};

export const getApprovedForCourt = async (req: Request, res: Response) => {
  const result = await documentRequestService.getApprovedForCourt();
  res.status(200).json({ success: true, data: result });
};

export const getByCase = async (req: Request, res: Response) => {
  const caseId = req.params.caseId;
  const userId = req.user!.id;
  const organizationId = req.user!.organizationId;
  const role = req.user!.role;

  const result = await documentRequestService.getRequestsByCase(caseId, userId, organizationId, role);
  res.status(200).json({ success: true, data: result });
};

export const issueRequest = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!req.file) {
    throw ApiError.badRequest('File is required');
  }

  const file = req.file as Express.Multer.File;
  const userId = req.user!.id;
  const { remarks } = req.body;

  const result = await documentRequestService.issue(id, file, userId, remarks);
  res.status(200).json({ success: true, data: result });
};

export const createValidator = [
  body('caseId').notEmpty().withMessage('caseId is required'),
  body('documentType').notEmpty().withMessage('documentType is required'),
  body('requestReason').notEmpty().withMessage('requestReason is required'),
  validate,
];

export const rejectValidator = [body('reason').notEmpty().withMessage('reason is required'), validate];

export const idParamValidator = [param('id').notEmpty().withMessage('id is required'), validate];
export const caseIdParamValidator = [param('caseId').notEmpty().withMessage('caseId is required'), validate];

export const issueValidator = [idParamValidator, uploadSingle('file'), validate];