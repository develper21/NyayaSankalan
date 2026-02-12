import apiClient from './axios';

export const aiEnhancedApi = {
  legalNer: async (text: string) => {
    const res = await apiClient.post('/ai/enhanced/legal-ner', { text });
    return res.data?.data || res.data;
  },
  suggestSections: async (caseDescription: string, topK = 5, codeType: 'ipc' | 'bns' | 'both' = 'both') => {
    const res = await apiClient.post('/ai/enhanced/suggest-sections', { case_description: caseDescription, top_k: topK, code_type: codeType });
    return res.data?.data || res.data;
  },
  findPrecedents: async (query: string, topK = 5, section?: string) => {
    const payload: { query: string; top_k: number; section?: string } = { query, top_k: topK };
    if (section) payload.section = section;
    const res = await apiClient.post('/ai/enhanced/find-precedents', payload);
    return res.data?.data || res.data;
  },
  suggestKeywords: async (text: string, maxItems = 8) => {
    const res = await apiClient.post('/ai/enhanced/suggest-keywords', { text, max_items: maxItems });
    return res.data?.data || res.data;
  },
  generateDocument: async (documentType: string, caseData: unknown) => {
    const res = await apiClient.post('/ai/enhanced/generate-document', { document_type: documentType, case_data: caseData });
    return res.data?.data || res.data;
  },
  multilingualOcr: async (file: File, language?: string, autoDetect = true) => {
    const form = new FormData();
    form.append('file', file);
    if (language) form.append('language', language);
    form.append('auto_detect', String(autoDetect));
    const res = await apiClient.post('/ai/enhanced/multilingual-ocr', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data?.data || res.data;
  },
  advancedSearch: async (query: string, topK = 5, useReranking = false) => {
    const res = await apiClient.post('/ai/enhanced/advanced-search', { query, top_k: topK, use_reranking: useReranking });
    return res.data?.data || res.data;
  },
  stats: async () => {
    const res = await apiClient.get('/ai/enhanced/stats');
    return res.data?.data || res.data;
  },
  templates: async () => {
    const res = await apiClient.get('/ai/enhanced/templates');
    return res.data?.data || res.data;
  },
  sectionDetails: async (id: string, codeType: 'ipc' | 'bns' = 'ipc') => {
    const res = await apiClient.get(`/ai/enhanced/section-details/${encodeURIComponent(id)}?code_type=${codeType}`);
    return res.data?.data || res.data;
  },
  precedentsBySection: async (section: string, topK = 10) => {
    const res = await apiClient.get(`/ai/enhanced/precedents/section/${encodeURIComponent(section)}?top_k=${topK}`);
    return res.data?.data || res.data;
  },
  getSectionsList: async (codeType: 'ipc' | 'bns' | 'both' = 'both') => {
    const res = await apiClient.get(`/ai/enhanced/sections-list?code_type=${codeType}`);
    return res.data?.data || res.data;
  },
};
