import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organization/organization.routes';
import firRoutes from './modules/fir/fir.routes';
import caseRoutes from './modules/case/case.routes';
import investigationRoutes from './modules/investigation/investigation.routes';
import documentRoutes from './modules/document/document.routes';
import courtRoutes from './modules/court/court.routes';
import bailRoutes from './modules/bail/bail.routes';
import auditRoutes from './modules/audit/audit.routes';
import documentRequestRoutes from './modules/document-requests/document-requests.routes';
import caseReopenRoutes from './modules/case-reopen/case-reopen.routes';
import timelineRoutes from './modules/timeline/timeline.routes';
import searchRoutes from './modules/search/search.routes';
import closureReportRoutes from './modules/closure-report/closure-report.routes';
import aiRoutes from './modules/ai/ai.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import aiEnhancedRoutes from './modules/ai/ai-enhanced.routes';
import aiFeaturesRoutes from './modules/ai/features.routes';
import { errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';
import { validateCloudinaryConfig } from './config/cloudinary';

export const createApp = (): Application => {
  const app = express();

  // Validate Cloudinary configuration
  validateCloudinaryConfig();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root endpoint - API info
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to NyayaSankalan API',
      version: '1.0.0',
      description: 'Police-Court Case Management System',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        organizations: '/api/police-stations, /api/courts',
        firs: '/api/firs',
        cases: '/api/cases',
        investigation: '/api/cases/:caseId/investigation-events, /evidence, /witnesses, /accused',
        documents: '/api/cases/:caseId/documents',
        court: '/api/cases/:caseId/submit-to-court, /intake, /court-actions',
        bail: '/api/cases/:caseId/bail-applications',
        audit: '/api/cases/:caseId/audit-logs',
        timeline: '/api/cases/:caseId/timeline',
      },
      documentation: 'See API_DOCUMENTATION.md for complete API reference',
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint - Enhanced with dependency checks
  app.get('/health', async (req, res) => {
    const health = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'up',
        database: 'unknown',
        aiPoc: 'unknown',
      },
    };

    try {
      // Check database connection
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'up';
      await prisma.$disconnect();
    } catch (err) {
      health.services.database = 'down';
      health.success = false;
      health.status = 'degraded';
    }

    // Check ai-poc service (non-blocking)
    try {
      const aiPocUrl = process.env.AI_POC_URL || 'http://localhost:8001';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${aiPocUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      health.services.aiPoc = response.ok ? 'up' : 'down';
    } catch (err) {
      health.services.aiPoc = 'down';
    }

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api', organizationRoutes); // /api/police-stations, /api/courts
  app.use('/api/firs', firRoutes);
  app.use('/api/cases', caseRoutes);
  app.use('/api', investigationRoutes); // /api/cases/:caseId/investigation-events, etc.
  app.use('/api', documentRoutes); // /api/cases/:caseId/documents
  app.use('/api', courtRoutes); // /api/cases/:caseId/submit-to-court, etc.
  app.use('/api', bailRoutes); // /api/cases/:caseId/bail-applications
  app.use('/api', auditRoutes); // /api/cases/:caseId/audit-logs
  app.use('/api/document-requests', documentRequestRoutes); // /api/document-requests
  app.use('/api', caseReopenRoutes);
  app.use('/api', timelineRoutes); // /api/cases/:caseId/timeline
  app.use('/api/search', searchRoutes); // /api/search?q=query
  app.use('/api', closureReportRoutes); // /api/cases/:caseId/closure-report
  app.use('/api/ai', aiRoutes); // /api/ai/search, /api/ai/index
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiEnhancedRoutes); // /api/ai/enhanced/*
  app.use('/api/ai', aiFeaturesRoutes); // /api/ai/case-readiness, /api/ai/document-validate, /api/ai/case-brief

  // 404 handler
  app.use((req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
