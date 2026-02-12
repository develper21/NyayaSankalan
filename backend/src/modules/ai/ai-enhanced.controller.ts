import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AIEnhancedService } from '../../services/ai-enhanced.service';

const service = new AIEnhancedService();

export const enhancedLegalNer = asyncHandler(async (req: Request, res: Response) => {
  try {
    const text: string = (req.body?.text as string) || '';
    if (!text) return res.status(400).json({ success: false, error: 'text is required' });
    const result = await service.extractLegalEntities(text);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedSuggestSections = asyncHandler(async (req: Request, res: Response) => {
  try {
    const caseDescription: string = (req.body?.case_description as string) || (req.body?.incident as string) || '';
    const topK: number = parseInt(String(req.body?.top_k ?? 5), 10);
    const codeType: string = (req.body?.code_type as string) || 'both';
    if (!caseDescription) return res.status(400).json({ success: false, error: 'case_description is required' });
    const result = await service.suggestSections(caseDescription, topK, codeType);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedFindPrecedents = asyncHandler(async (req: Request, res: Response) => {
  try {
    const query: string = (req.body?.query as string) || '';
    const topK: number = parseInt(String(req.body?.top_k ?? 5), 10);
    const section: string | undefined = req.body?.section as string | undefined;
    if (!query) return res.status(400).json({ success: false, error: 'query is required' });
    const result = await service.findPrecedents(query, topK, section);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedSuggestKeywords = asyncHandler(async (req: Request, res: Response) => {
  const text: string = (req.body?.text as string) || '';
  const maxItems: number = parseInt(String(req.body?.max_items ?? 8), 10);
  if (!text) return res.status(400).json({ success: false, error: 'text is required' });
  try {
    const result = await service.suggestKeywords(text, maxItems);
    return res.status(200).json({ success: true, data: result.data || result });
  } catch (err: any) {
    // Graceful fallback when AI PoC service is unavailable
    const message = typeof err?.message === 'string' ? err.message : 'AI service unavailable';
    return res.status(200).json({
      success: true,
      data: { keywords: [], sections: [], context: [] },
      meta: { fallback: true, error: message },
    });
  }
});

export const enhancedGenerateDocument = asyncHandler(async (req: Request, res: Response) => {
  try {
    const documentType: string = (req.body?.document_type as string) || (req.body?.documentType as string);
    const caseData: any = req.body?.case_data ?? req.body?.caseData;
    if (!documentType) return res.status(400).json({ success: false, error: 'document_type is required' });
    if (!caseData) return res.status(400).json({ success: false, error: 'case_data is required' });
    const result = await service.generateDocument(documentType, caseData);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedMultilingualOcr = asyncHandler(async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const language: string | undefined = (req.body?.language as string) || undefined;
    const autoDetect: boolean = String(req.body?.auto_detect ?? 'true') === 'true';
    if (!file) return res.status(400).json({ success: false, error: 'file is required' });
    const result = await service.multilingualOCR(file, language, autoDetect);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedAdvancedSearch = asyncHandler(async (req: Request, res: Response) => {
  try {
    const query: string = (req.body?.query as string) || '';
    const topK: number = parseInt(String(req.body?.top_k ?? 5), 10);
    const useReranking: boolean = String(req.body?.use_reranking ?? 'false') === 'true';
    if (!query) return res.status(400).json({ success: false, error: 'query is required' });
    const result = await service.advancedSearch(query, topK, useReranking);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedStats = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await service.stats();
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedTemplates = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const result = await service.templates();
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedSectionDetails = asyncHandler(async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const codeType: string = (req.query?.code_type as string) || 'ipc';
    const result = await service.sectionDetails(id, codeType);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedPrecedentsBySection = asyncHandler(async (req: Request, res: Response) => {
  try {
    const section = req.params.section;
    const topK: number = parseInt(String(req.query?.top_k ?? 10), 10);
    const result = await service.precedentsBySection(section, topK);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});

export const enhancedGetSectionsList = asyncHandler(async (req: Request, res: Response) => {
  try {
    const codeType: string = (req.query?.code_type as string) || 'both';
    const result = await service.getSectionsList(codeType);
    res.status(200).json({ success: true, data: result.data || result });
  } catch (error: any) {
    return res.status(503).json({ success: false, error: 'AI service temporarily unavailable', fallback: true });
  }
});
