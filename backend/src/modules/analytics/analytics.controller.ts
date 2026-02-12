import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../prisma/client';
import { CaseState } from '@prisma/client';

export const getAnalyticsData = async (organizationId?: string) => {
    // 1. Case Status Distribution (Query CurrentCaseState model instead of Case)
    const caseStats = await prisma.currentCaseState.groupBy({
        by: ['currentState'],
        where: organizationId ? {
            case: {
                fir: {
                    policeStationId: organizationId
                }
            }
        } : undefined,
        _count: {
            _all: true
        }
    });

    // 2. Total Cases
    const totalCases = await prisma.case.count({
        where: organizationId ? {
            fir: {
                policeStationId: organizationId
            }
        } : undefined
    });

    // 3. Monthly Trends (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.case.findMany({
        where: {
            createdAt: {
                gte: sixMonthsAgo
            },
            ...(organizationId ? {
                fir: {
                    policeStationId: organizationId
                }
            } : {})
        },
        select: {
            createdAt: true
        }
    });

    // Process monthly data in JS (simpler than complex SQL for now)
    const monthlyTrends = monthlyData.reduce((acc: any, curr) => {
        const month = new Date(curr.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    const trendsChartData = Object.entries(monthlyTrends).map(([name, count]) => ({ name, cases: count }));

    // 4. Pending vs Solved
    const pendingCount = await prisma.case.count({
        where: {
            state: { // Access relation 'state'
                currentState: {
                    notIn: ['DISPOSED', 'ARCHIVED']
                }
            },
            ...(organizationId ? {
                fir: {
                    policeStationId: organizationId
                }
            } : {})
        }
    });

    return {
        totalCases,
        activeCases: pendingCount,
        closedCases: totalCases - pendingCount,
        statusDistribution: caseStats.map(stat => ({
            name: stat.currentState.replace(/_/g, ' '),
            value: stat._count._all
        })),
        monthlyTrends: trendsChartData
    };
};

/**
 * GET /api/analytics/dashboard
 * Get aggregated analytics for the dashboard
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;
    const data = await getAnalyticsData(organizationId);

    res.status(200).json({
        success: true,
        data
    });
});
