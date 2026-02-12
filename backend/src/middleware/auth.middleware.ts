import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';
import prisma from '../prisma/client';
import { UserRole, OrganizationType } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationType: OrganizationType;
  organizationId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware - verifies JWT and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationType: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid or inactive user');
    }

    req.user = user as AuthUser;

    // Log access
    await prisma.accessLog.create({
      data: {
        userId: user.id,
        resourceAccessed: `${req.method} ${req.path}`,
        timestamp: new Date(),
      },
    });

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(ApiError.unauthorized('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};
