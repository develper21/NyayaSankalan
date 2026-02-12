import { AIService } from '../ai.service';
import { rebuildIndex, indexDocument, proxySearch } from '../ai.controller';

// Very small unit test placeholders demonstrating intended tests
// Test framework not configured in this environment; add and run in CI locally.

describe('AI controller', () => {
  it('should return 400 for missing query in search', async () => {
    const req: any = { query: {} };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await proxySearch(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
