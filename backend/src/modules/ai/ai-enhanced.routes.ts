import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';
import {
  enhancedLegalNer,
  enhancedSuggestSections,
  enhancedFindPrecedents,
  enhancedSuggestKeywords,
  enhancedGenerateDocument,
  enhancedMultilingualOcr,
  enhancedAdvancedSearch,
  enhancedStats,
  enhancedTemplates,
  enhancedSectionDetails,
  enhancedPrecedentsBySection,
  enhancedGetSectionsList,
} from './ai-enhanced.controller';

const router = Router();

// Enhanced AI endpoints (proxied to ai-poc service)
router.post('/enhanced/legal-ner', authenticate, enhancedLegalNer);
router.post('/enhanced/suggest-sections', authenticate, enhancedSuggestSections);
router.post('/enhanced/find-precedents', authenticate, enhancedFindPrecedents);
router.post('/enhanced/suggest-keywords', authenticate, enhancedSuggestKeywords);
router.post('/enhanced/generate-document', authenticate, enhancedGenerateDocument);
router.post('/enhanced/multilingual-ocr', authenticate, uploadSingle('file'), enhancedMultilingualOcr);
router.post('/enhanced/advanced-search', authenticate, enhancedAdvancedSearch);
router.get('/enhanced/stats', authenticate, enhancedStats);
router.get('/enhanced/templates', authenticate, enhancedTemplates);
router.get('/enhanced/section-details/:id', authenticate, enhancedSectionDetails);
router.get('/enhanced/precedents/section/:section', authenticate, enhancedPrecedentsBySection);
router.get('/enhanced/sections-list', authenticate, enhancedGetSectionsList);

export default router;
