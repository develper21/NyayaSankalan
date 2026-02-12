import { Router } from 'express';
import { body } from 'express-validator';
import { login, getCurrentUser } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Public route - login with email and password
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

/**
 * GET /api/auth/me
 * Protected route - get current user
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
