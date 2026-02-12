process.env.AI_POC_URL = 'http://ai-poc.test';

import request from 'supertest';
import express, { Router } from 'express';

// Import controller handlers after setting env var
import { rebuildIndex, indexDocument, proxySearch } from '../ai.controller';
import { AIService } from '../ai.service';

// Simple mock auth middleware to attach user
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'test-user', role: 'ADMIN', organizationId: 'org-1' };
  next();
};

const makeApp = () => {
  const app = express();
  app.use(express.json());
  const router = Router();
  router.post('/index', mockAuth, rebuildIndex);
  router.post('/index/doc/:id', mockAuth, indexDocument);
  router.get('/search', mockAuth, proxySearch);
  app.use('/api/ai', router);
  // error handler to surface in tests
  app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500).json({ success: false, error: err.message });
  });
  return app;
};

describe('AI proxy integration (mocked)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('POST /api/ai/index forwards to ai-poc and returns success', async () => {
    jest.spyOn(AIService.prototype, 'indexAll').mockResolvedValue({ success: true, indexed: 3 } as any);

    const app = makeApp();
    const res = await request(app).post('/api/ai/index');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.indexed).toBe(3);
  });

  it('GET /api/ai/search returns 400 when q missing', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/ai/search');
    expect(res.status).toBe(400);
  });

  it('GET /api/ai/search forwards query and returns hits', async () => {
    const fakeRes = { data: [{ id: 'x', score: 0.5, snippet: 'hi' }] };
    jest.spyOn(AIService.prototype, 'search').mockResolvedValue(fakeRes as any);

    const app = makeApp();
    const res = await request(app).get('/api/ai/search').query({ q: 'john', k: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('x');
  });

  it('POST /api/ai/index/doc/:id forwards and returns 200', async () => {
    const id = 'abc123';
    jest.spyOn(AIService.prototype, 'indexDocument').mockResolvedValue({ indexed: 1, indexedId: id } as any);

    const app = makeApp();
    const res = await request(app).post(`/api/ai/index/doc/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.indexedId).toBe(id);
  });
});
