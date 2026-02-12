import { Router } from 'express';
import { getAllPoliceStations, getAllCourts, getOfficersByStation, getMyStationOfficers } from './organization.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { allowAll, isSHO } from '../../middleware/role.middleware';

const router = Router();

/**
 * GET /api/police-stations
 * Get all police stations - accessible by all authenticated users
 */
router.get('/police-stations', authenticate, allowAll, getAllPoliceStations);

/**
 * GET /api/courts
 * Get all courts - accessible by all authenticated users
 */
router.get('/courts', authenticate, allowAll, getAllCourts);

/**
 * GET /api/officers
 * Get police officers in current user's station - SHO only
 */
router.get('/officers', authenticate, isSHO, getMyStationOfficers);

/**
 * GET /api/police-stations/:stationId/officers
 * Get police officers in a specific station - SHO only
 */
router.get('/police-stations/:stationId/officers', authenticate, isSHO, getOfficersByStation);

export default router;
