import { prisma } from '../../prisma/client';
import { UserRole } from '@prisma/client';

export class OrganizationService {
  /**
   * List all police stations
   */
  async getPoliceStations() {
    const stations = await prisma.policeStation.findMany({
      select: {
        id: true,
        name: true,
        district: true,
        state: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return stations;
  }

  /**
   * List all courts
   */
  async getCourts() {
    const courts = await prisma.court.findMany({
      select: {
        id: true,
        name: true,
        courtType: true,
        district: true,
        state: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return courts;
  }

  /**
   * List police officers in a police station (for SHO to assign cases)
   */
  async getOfficersByStation(policeStationId: string) {
    const officers = await prisma.user.findMany({
      where: {
        organizationId: policeStationId,
        role: UserRole.POLICE,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return officers;
  }
}
