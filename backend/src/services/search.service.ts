import { prisma } from '../prisma/client';

interface SearchResult {
  caseId: string;
  firNumber: string;
  accusedNames: string[];
  caseState: string;
  assignedOfficer: string | null;
  policeStation: string;
  createdAt: Date;
}

export class SearchService {
  /**
   * Global search across cases
   * Respects role-based access control
   */
  async search(
    query: string,
    userId: string,
    userRole: string,
    organizationId: string | null,
    limit: number = 20
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    // Build base where clause based on role
    let roleFilter: any = {};

    if (userRole === 'POLICE') {
      // Police can only see their assigned cases
      roleFilter = {
        assignments: {
          some: {
            assignedTo: userId,
            unassignedAt: null,
          },
        },
      };
    } else if (userRole === 'SHO') {
      // SHO can see all cases from their police station
      roleFilter = {
        fir: {
          policeStationId: organizationId,
        },
      };
    } else if (userRole === 'COURT_CLERK' || userRole === 'JUDGE') {
      // Court/Judge can see submitted cases to their court
      roleFilter = {
        courtSubmissions: {
          some: {
            courtId: organizationId,
          },
        },
      };
    }

    // Search across multiple fields
    const cases = await prisma.case.findMany({
      where: {
        AND: [
          roleFilter,
          {
            OR: [
              // Search by case ID (partial match)
              {
                id: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              // Search by FIR number
              {
                fir: {
                  firNumber: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
              },
              // Search by accused name
              {
                accused: {
                  some: {
                    name: {
                      contains: searchTerm,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              // Search by assigned officer name
              {
                assignments: {
                  some: {
                    assignedUser: {
                      name: {
                        contains: searchTerm,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        fir: {
          include: {
            policeStation: {
              select: { name: true },
            },
          },
        },
        state: true,
        accused: {
          select: { name: true },
        },
        assignments: {
          where: { unassignedAt: null },
          include: {
            assignedUser: {
              select: { name: true },
            },
          },
          take: 1,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Transform results
    return cases.map((c) => ({
      caseId: c.id,
      firNumber: c.fir.firNumber,
      accusedNames: c.accused.map((a) => a.name),
      caseState: c.state?.currentState || 'UNKNOWN',
      assignedOfficer: c.assignments[0]?.assignedUser.name || null,
      policeStation: c.fir.policeStation.name,
      createdAt: c.createdAt,
    }));
  }
}
