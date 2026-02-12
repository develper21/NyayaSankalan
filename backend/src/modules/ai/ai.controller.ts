import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { asyncHandler } from '../../utils/asyncHandler';

const aiService = new AIService();

export const rebuildIndex = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.indexAll();
  res.status(200).json({ success: true, data: result });
});

export const indexDocument = asyncHandler(async (req: Request, res: Response) => {
  const extractionId = req.params.id;
  if (!extractionId) return res.status(400).json({ success: false, error: 'extraction id required' });
  const result = await aiService.indexDocument(extractionId);
  res.status(200).json({ success: true, data: result });
});

export const proxySearch = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const k = parseInt((req.query.k as string) || '5', 10);
  if (!q) return res.status(400).json({ success: false, error: "Query parameter 'q' required" });
  const result = await aiService.search(q, k);
  res.status(200).json({ success: true, data: result.data || result });
});

export const proxyOcrExtract = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'file is required' });
  const result = await aiService.ocrExtract(file);
  res.status(200).json({ success: true, data: result.data || result });
});

export const proxyGenerateDraft = asyncHandler(async (req: Request, res: Response) => {
  const { caseId, documentType, context } = req.body;
  if (!documentType) return res.status(400).json({ success: false, error: 'documentType is required' });
  const result = await aiService.generateDraft({ caseId, documentType, context });
});

import { getAnalyticsData } from '../analytics/analytics.controller';

export const proxyChat = asyncHandler(async (req: Request, res: Response) => {
  const { q, k, model } = req.body;

  if (!q) {
    return res.status(400).json({ success: false, error: 'Query (q) is required' });
  }

  // Intercept "Stats" questions
  const lowerQ = q.toLowerCase();
  if (lowerQ.includes('how many case') || lowerQ.includes('how many fir') || lowerQ.includes('total cases') || lowerQ.includes('stats') || lowerQ.includes('analytics')) {
    const organizationId = req.user?.organizationId;
    const stats = await getAnalyticsData(organizationId);

    const answer = `Here are your current statistics:\n\n` +
      `📌 **Total Cases**: ${stats.totalCases}\n` +
      `⚠️ **Active/Pending**: ${stats.activeCases}\n` +
      `✅ **Solved/Closed**: ${stats.closedCases}\n\n` +
      `You can view more details in the Analytics Dashboard.`;

    return res.status(200).json({
      success: true,
      answer,
      sources: [{ source: 'System Database', score: 1.0, id: 'db-stats' }]
    });
  }

  const result = await aiService.chat({ q, k, model });
  res.status(200).json(result);
});
