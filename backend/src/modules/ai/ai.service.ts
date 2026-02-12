import { config } from '../../config/env';
import type { Express } from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class AIService {
  baseUrl: string;

  constructor() {
    this.baseUrl = config.aiPocUrl;
  }

  private getOutputDir(): string {
    // backend runs from /backend; ai-poc lives at ../ai-poc/storage/output/ai_extractions
    return path.resolve(process.cwd(), '../ai-poc/storage/output/ai_extractions');
  }

  /**
   * Health check for AI PoC service availability
   * Returns true if service is reachable, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async indexAll(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/index`, { method: 'POST' });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async indexDocument(extractionId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/index/doc/${extractionId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async search(query: string, k = 5): Promise<any> {
    const params = new URLSearchParams({ q: query, k: String(k) });
    const res = await fetch(`${this.baseUrl}/search?${params.toString()}`);
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async ocrExtract(file: Express.Multer.File): Promise<any> {
    const form = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    form.append('file', blob, file.originalname);

    const res = await fetch(`${this.baseUrl}/ocr-extract`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    const data = await res.json();

    // ai-poc returns extractionId and entities, but extracted text is stored in JSON
    // Fetch the full extraction to get the extracted text
    if (data.data?.extractionId) {
      const extractionId = data.data.extractionId;
      const extractRes = await fetch(`${this.baseUrl}/extractions/${extractionId}`);
      if (extractRes.ok) {
        const extraction = await extractRes.json();
        // Merge the extracted text from the stored extraction
        if (extraction.data?.extractedText) {
          data.data.extractedText = extraction.data.extractedText;
          data.data.redactedText = extraction.data.redactedText;
        }
      }
    }

    return data;
  }

  async generateDraft(payload: { caseId?: string; documentType: string; context?: string }): Promise<any> {
    // ai-poc /generate-draft expects form data with 'text' and optionally 'model'
    // Construct a simple prompt from context or use a default
    const promptText = payload.context || `Generate a ${payload.documentType} document`;

    const formData = new URLSearchParams();
    formData.append('text', promptText);
    formData.append('model', 'flan-t5-small');

    const res = await fetch(`${this.baseUrl}/generate-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    return res.json();
  }

  async writeFirExtraction(payload: {
    caseId: string;
    firNumber: string;
    sectionsApplied: string;
    incidentDate: Date | string;
    policeStationName?: string;
  }): Promise<string> {
    const extractionId = crypto.randomUUID();
    const outputDir = this.getOutputDir();

    // Ensure directory exists and is writable
    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.access(outputDir, fs.constants.W_OK);
    } catch (err) {
      throw new Error(`AI storage directory not accessible: ${outputDir}`);
    }

    const incidentDateStr = payload.incidentDate instanceof Date
      ? payload.incidentDate.toISOString().split('T')[0]
      : payload.incidentDate;

    const extractedText = [
      `FIR Number: ${payload.firNumber}`,
      `Sections: ${payload.sectionsApplied}`,
      `Incident Date: ${incidentDateStr}`,
      payload.policeStationName ? `Police Station: ${payload.policeStationName}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const extraction = {
      id: extractionId,
      caseId: payload.caseId,
      sourceFile: 'fir-generated',
      extractedText,
      redactedText: extractedText,
      entities: {},
      confidence: 1.0,
      createdAt: new Date().toISOString(),
    };

    const outPath = path.join(outputDir, `${extractionId}.json`);
    await fs.writeFile(outPath, JSON.stringify(extraction, null, 2), 'utf-8');

    return extractionId;
  }

  async indexFirExtraction(payload: {
    caseId: string;
    firNumber: string;
    sectionsApplied: string;
    incidentDate: Date | string;
    policeStationName?: string;
  }): Promise<void> {
    const extractionId = await this.writeFirExtraction(payload);
    // Rebuild/upsert index with this extraction; swallow errors to avoid impacting main flow
    try {
      await this.indexDocument(extractionId);
    } catch (err) {
      console.error('AI indexing skipped for FIR extraction', err);
    }
  }

  async chat(payload: { q: string; k?: number; model?: string }): Promise<any> {
    const formData = new FormData();
    formData.append('q', payload.q);
    if (payload.k) formData.append('k', payload.k.toString());
    if (payload.model) formData.append('model', payload.model);

    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`AI Chat Error: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }
}
