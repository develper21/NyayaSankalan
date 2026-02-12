import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';

const authService = new AuthService();

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});
