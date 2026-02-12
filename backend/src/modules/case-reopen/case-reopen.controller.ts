import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { asyncHandler } from '../../utils/asyncHandler';
import caseReopenService from './case-reopen.service';
import { validate } from '../../middleware/validation.middleware';

export const requestReopen = asyncHandler(async (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { policeReason } = req.body;
  const userId = (req as any).user.id;

  const result = await caseReopenService.createRequestWithReason(caseId, userId, policeReason);
  res.status(201).json({ success: true, data: result });
});

export const getMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await caseReopenService.getMyRequests(userId);
  res.status(200).json({ success: true, data: result });
});

export const getPendingForJudge = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user.organizationId;
  const result = await caseReopenService.getPendingForJudge(organizationId);
  res.status(200).json({ success: true, data: result });
});

export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { judgeNote } = req.body;
  const userId = (req as any).user.id;
  const organizationId = (req as any).user.organizationId;

  const result = await caseReopenService.approve(id, userId, judgeNote, organizationId);
  res.status(200).json({ success: true, data: result });
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = (req as any).user.id;
  const organizationId = (req as any).user.organizationId;

  const result = await caseReopenService.reject(id, userId, reason, organizationId);
  res.status(200).json({ success: true, data: result });
});

export const createValidator = [param('caseId').notEmpty().withMessage('caseId is required'), body('policeReason').notEmpty().withMessage('policeReason is required'), validate];
export const idParamValidator = [param('id').notEmpty().withMessage('id is required'), validate];
export const approveValidator = [param('id').notEmpty().withMessage('id is required'), body('judgeNote').notEmpty().withMessage('judgeNote is required'), validate];
export const rejectValidator = [param('id').notEmpty().withMessage('id is required'), body('reason').notEmpty().withMessage('reason is required'), validate];
