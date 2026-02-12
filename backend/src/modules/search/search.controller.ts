import { Request, Response } from 'express';
import { SearchService } from '../../services/search.service';
import { asyncHandler } from '../../utils/asyncHandler';

const searchService = new SearchService();

/**
 * GET /api/search?q=query
 * Global search endpoint
 */
export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!req.user) {
    throw new Error('Authentication required');
  }
  
  const userId = req.user.id;
  const userRole = req.user.role;
  const organizationId = req.user.organizationId;

  const results = await searchService.search(query, userId, userRole, organizationId, limit);

  res.status(200).json({
    success: true,
    data: results,
  });
});
