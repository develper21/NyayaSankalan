import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const organizationService = new OrganizationService();

/**
 * GET /api/police-stations
 * Get all police stations
 */
export const getAllPoliceStations = asyncHandler(async (req: Request, res: Response) => {
  const policeStations = await organizationService.getPoliceStations();

  res.status(200).json({
    success: true,
    data: policeStations,
  });
});

/**
 * GET /api/courts
 * Get all courts
 */
export const getAllCourts = asyncHandler(async (req: Request, res: Response) => {
  const courts = await organizationService.getCourts();

  res.status(200).json({
    success: true,
    data: courts,
  });
});

/**
 * GET /api/police-stations/:stationId/officers
 * Get police officers in a station (SHO only)
 */
export const getOfficersByStation = asyncHandler(async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const userOrganizationId = req.user!.organizationId;

  // SHO can only get officers from their own station
  if (stationId !== userOrganizationId) {
    throw ApiError.forbidden('You can only view officers from your own station');
  }

  const officers = await organizationService.getOfficersByStation(stationId);

  res.status(200).json({
    success: true,
    data: officers,
  });
});

/**
 * GET /api/officers
 * Get police officers in current user's station (SHO only)
 */
export const getMyStationOfficers = asyncHandler(async (req: Request, res: Response) => {
  const userOrganizationId = req.user!.organizationId;

  if (!userOrganizationId) {
    throw ApiError.badRequest('User must be associated with a police station');
  }

  const officers = await organizationService.getOfficersByStation(userOrganizationId);

  res.status(200).json({
    success: true,
    data: officers,
  });
});
