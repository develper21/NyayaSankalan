import { config } from '../config/env';

export class AIEnhancedService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.aiPocUrl || 'http://localhost:8001';
  }

  async extractLegalEntities(text: string): Promise<any> {
    const form = new URLSearchParams();
    form.append('text', text);
    const res = await fetch(`${this.baseUrl}/api/ai/legal-ner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async suggestSections(caseDescription: string, topK = 5, codeType = 'both'): Promise<any> {
    const form = new URLSearchParams();
    form.append('case_description', caseDescription);
    form.append('top_k', String(topK));
    form.append('code_type', codeType);
    const res = await fetch(`${this.baseUrl}/api/ai/suggest-sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async findPrecedents(query: string, topK = 5, section?: string): Promise<any> {
    const form = new URLSearchParams();
    form.append('query', query);
    form.append('top_k', String(topK));
    if (section) form.append('section', section);
    const res = await fetch(`${this.baseUrl}/api/ai/find-precedents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async suggestKeywords(text: string, maxItems = 8): Promise<any> {
    const form = new URLSearchParams();
    form.append('text', text);
    form.append('max_items', String(maxItems));
    const res = await fetch(`${this.baseUrl}/api/ai/suggest-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async generateDocument(documentType: string, caseData: any): Promise<any> {
    const form = new URLSearchParams();
    form.append('document_type', documentType);
    form.append('case_data', JSON.stringify(caseData));
    const res = await fetch(`${this.baseUrl}/api/ai/generate-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async multilingualOCR(file: Express.Multer.File, language?: string, autoDetect = true): Promise<any> {
    const blob = new Blob([file.buffer], { type: file.mimetype });
    const form = new FormData();
    form.append('file', blob, file.originalname);
    if (language) form.append('language', language);
    form.append('auto_detect', String(autoDetect));
    const res = await fetch(`${this.baseUrl}/api/ai/multilingual-ocr`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async advancedSearch(query: string, topK = 5, useReranking = false): Promise<any> {
    const form = new URLSearchParams();
    form.append('query', query);
    form.append('top_k', String(topK));
    form.append('use_reranking', String(useReranking));
    const res = await fetch(`${this.baseUrl}/api/ai/advanced-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async stats(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/ai/stats`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async templates(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/ai/templates`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async sectionDetails(sectionNumber: string, codeType = 'ipc'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/ai/section-details/${encodeURIComponent(sectionNumber)}?code_type=${encodeURIComponent(codeType)}`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async precedentsBySection(section: string, topK = 10): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/ai/precedents/section/${encodeURIComponent(section)}?top_k=${encodeURIComponent(String(topK))}`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async getSectionsList(codeType = 'both'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/ai/sections-list?code_type=${encodeURIComponent(codeType)}`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }
}
