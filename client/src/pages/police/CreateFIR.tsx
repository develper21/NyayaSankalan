import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/common/FileUpload';
import { firApi } from '../../api';
import apiClient from '../../api/axios';

export const CreateFIR: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [firDocument, setFirDocument] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [extractError, setExtractError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    incidentDate: '',
    sectionsApplied: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const fir = await firApi.createFIR(
        formData.incidentDate,
        formData.sectionsApplied,
        firDocument || undefined
      );
      toast.success('FIR created successfully');
      navigate(`/police/cases/${fir.caseId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create FIR';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractText = async () => {
    if (!firDocument) {
      toast.error('Please select a FIR document first');
      return;
    }

    setExtracting(true);
    setExtractError(null);
    setExtractedText('');
    try {
      const formData = new FormData();
      formData.append('file', firDocument);

      const response = await apiClient.post('/ai/ocr-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('[OCR Extract Response]:', response.data);
      
      const text = response.data?.extractedText || response.data?.data?.extractedText || response.data?.data || '';
      setExtractedText(text);
      if (!text) {
        toast.error('No text extracted (check browser console for response structure)');
      } else {
        toast.success('Text extracted');
      }
    } catch (err: unknown) {
      console.error('[OCR Extract Error]:', err);
      type ErrorResponse = { response?: { data?: { message?: string; error?: string } }; message?: string };
      const error = err as ErrorResponse;
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Extraction failed';
      setExtractError(message);
      toast.error(message);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <>
      <Header
        title="Create FIR"
        subtitle="Register a new First Information Report"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Incident Date & Time"
              type="datetime-local"
              name="incidentDate"
              value={formData.incidentDate}
              onChange={handleChange}
              required
            />

            <Textarea
              label="Sections Applied"
              name="sectionsApplied"
              value={formData.sectionsApplied}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Enter IPC sections applied (e.g., Section 302, 307 IPC)"
            />
          </div>

          <FileUpload
            label="FIR Document (Optional - PDF/JPG/PNG)"
            accept=".pdf,.jpg,.jpeg,.png"
            onFileSelect={setFirDocument}
            currentFile={firDocument}
            maxSize={20}
          />

          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-800">Extract Document Text</p>
                <p className="text-xs text-blue-700">
                  AI-generated output — requires officer review before saving.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleExtractText}
                isLoading={extracting}
                disabled={!firDocument}
              >
                {extracting ? '📄 Extracting text...' : '📄 Extract Document Text'}
              </Button>
            </div>

            {extractError && (
              <p className="mt-2 text-sm text-red-600">{extractError}</p>
            )}

            <div className="mt-3">
              <Textarea
                label="Extracted Text"
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={6}
                placeholder="Extracted text will appear here"
              />
              <p className="text-xs text-gray-500 mt-1">
                Preview mode — content is not recorded until formally submitted.
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Create FIR
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/police/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};
