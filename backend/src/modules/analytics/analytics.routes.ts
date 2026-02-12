import { Router } from 'express';
import { getDashboardStats } from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);

export default router;
