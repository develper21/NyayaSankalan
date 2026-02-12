import { Router } from 'express';
import { globalSearch } from './search.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/search?q=query
 * Global search - available to all authenticated users
 */
router.get('/', authenticate, globalSearch);

export default router;
