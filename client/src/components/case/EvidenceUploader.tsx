import React, { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { EvidenceCategory } from '../../types/api.types';

interface EvidenceUploaderProps {
  onUpload: (file: File, category: EvidenceCategory, description: string) => Promise<void>;
  isSubmitting?: boolean;
}

const categoryOptions = [
  { value: EvidenceCategory.PHOTO, label: '📷 Photo', icon: '📷' },
  { value: EvidenceCategory.REPORT, label: '📄 Report', icon: '📄' },
  { value: EvidenceCategory.FORENSIC, label: '🔬 Forensic', icon: '🔬' },
  { value: EvidenceCategory.STATEMENT, label: '📝 Statement', icon: '📝' },
];

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onUpload, isSubmitting }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<EvidenceCategory>(EvidenceCategory.PHOTO);
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    // Validate file
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 20MB');
      return;
    }

    setFile(selectedFile);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else if (selectedFile.type === 'application/pdf') {
      setPreview('pdf');
    } else {
      setPreview('file');
    }

    toast.success('File selected');
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (actual progress would need axios onUploadProgress)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      await onUpload(file, category, description);
      setUploadProgress(100);
      toast.success('Evidence uploaded successfully');
      // Reset form
      setFile(null);
      setPreview(null);
      setDescription('');
      setCategory(EvidenceCategory.PHOTO);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h4 className="font-medium text-gray-800 flex items-center gap-2">
        <span>📎</span> Upload Evidence
      </h4>

      {/* Drag & Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        {file ? (
          <div className="space-y-3">
            {/* Preview */}
            {preview === 'pdf' ? (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center text-3xl">
                📑
              </div>
            ) : preview === 'file' ? (
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                📁
              </div>
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-32 rounded-lg shadow-sm object-contain"
              />
            ) : null}
            <div className="text-sm text-gray-700 font-medium truncate">{file.name}</div>
            <div className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl mb-3">
              📤
            </div>
            <p className="text-sm text-gray-600">
              <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC (Max 20MB)</p>
          </div>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Category</label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                category === opt.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the evidence..."
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading || isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <span className="animate-spin">⏳</span> Uploading...
          </>
        ) : (
          <>
            <span>⬆️</span> Upload Evidence
          </>
        )}
      </button>
    </div>
  );
};
