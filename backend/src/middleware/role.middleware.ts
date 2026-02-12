import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};

/**
 * Check if user is SHO
 */
export const isSHO = requireRole(UserRole.SHO);

/**
 * Check if user is POLICE or SHO
 */
export const isPolice = requireRole(UserRole.POLICE, UserRole.SHO);

/**
 * Check if user is COURT_CLERK
 */
export const isCourtClerk = requireRole(UserRole.COURT_CLERK);

/**
 * Check if user is JUDGE
 */
export const isJudge = requireRole(UserRole.JUDGE);

/**
 * Check if user is COURT_CLERK or JUDGE
 */
export const isCourt = requireRole(UserRole.COURT_CLERK, UserRole.JUDGE);

/**
 * Allow all authenticated users
 */
export const allowAll = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(ApiError.unauthorized('User not authenticated'));
  }
  next();
};
