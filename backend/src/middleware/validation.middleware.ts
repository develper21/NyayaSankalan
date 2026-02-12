import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

/**
 * Middleware to validate request using express-validator
 * Should be used after validation chains
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw ApiError.badRequest(errorMessages.join(', '));
  }

  next();
};
