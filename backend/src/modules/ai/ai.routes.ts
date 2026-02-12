import { Router } from 'express';
import { rebuildIndex, syncIndexFromDatabase, proxySearch, indexDocument, proxyOcrExtract, proxyGenerateDraft, proxyChat } from './ai.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadSingle } from '../../middleware/upload.middleware';

const router = Router();

// POST /api/ai/index -> rebuild full index
router.post('/index', authenticate, rebuildIndex);

// POST /api/ai/index/doc/:id -> index a single extraction (upsert)
router.post('/index/doc/:id', authenticate, indexDocument);

// GET /api/ai/search?q=...&k=5 -> proxy search
router.get('/search', authenticate, proxySearch);

// POST /api/ai/chat -> RAG Chat
router.post('/chat', authenticate, proxyChat);

// POST /api/ai/ocr-extract -> OCR extract (demo)
router.post('/ocr-extract', authenticate, uploadSingle('file'), proxyOcrExtract);

// POST /api/ai/generate-draft -> Draft generation (demo)
router.post('/generate-draft', authenticate, proxyGenerateDraft);

export default router;
