import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// File size limit: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type: ${file.mimetype}. Allowed types: PDF, JPG, PNG`));
  }
};

// Configure multer for memory storage (buffer)
const storage = multer.memoryStorage();

// Base multer configuration
const multerConfig: multer.Options = {
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
};

// Create multer instance
const upload = multer(multerConfig);

/**
 * Middleware for single file upload
 * @param fieldName - Form field name for the file
 */
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Middleware for multiple files upload (same field)
 * @param fieldName - Form field name for the files
 * @param maxCount - Maximum number of files
 */
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
  upload.array(fieldName, maxCount);

/**
 * Middleware for multiple fields with files
 * @param fields - Array of field configurations
 */
export const uploadFields = (fields: multer.Field[]) => upload.fields(fields);

/**
 * Error handler for multer errors
 */
export const handleMulterError = (
  error: Error,
  _req: Request,
  _res: Response,
  next: Function
): void => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        next(new ApiError(400, 'File size exceeds the 20MB limit'));
        break;
      case 'LIMIT_FILE_COUNT':
        next(new ApiError(400, 'Too many files. Maximum 10 files allowed'));
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        next(new ApiError(400, `Unexpected field: ${error.field}`));
        break;
      default:
        next(new ApiError(400, `Upload error: ${error.message}`));
    }
  } else {
    next(error);
  }
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
};
