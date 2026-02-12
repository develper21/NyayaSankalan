import { cloudinary } from '../config/cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../prisma/client';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// File size limits (in bytes)
const MIN_FILE_SIZE = 1024; // 1KB minimum
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB maximum

// Cloudinary folder structure
export enum CloudinaryFolder {
  FIRS = 'nyayasankalan/firs',
  EVIDENCE = 'nyayasankalan/evidence',
  DOCUMENTS = 'nyayasankalan/documents',
  COURT_ORDERS = 'nyayasankalan/court-orders',
}

export interface UploadResult {
  secure_url: string;
  public_id: string; // For internal use only, never expose to frontend
  format: string;
  bytes: number;
  original_filename: string;
}

export interface FileUploadOptions {
  folder: CloudinaryFolder;
  resourceType?: 'image' | 'raw' | 'auto';
  allowedTypes?: string[];
  maxSize?: number;
}

/**
 * Validate file before upload
 */
const validateFile = (
  file: Express.Multer.File,
  options: FileUploadOptions
): void => {
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES;
  const maxSize = options.maxSize || MAX_FILE_SIZE;

  // Check file exists
  if (!file || !file.buffer) {
    throw new ApiError(400, 'No file provided');
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ApiError(
      400,
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Check file size
  if (file.size < MIN_FILE_SIZE) {
    throw new ApiError(400, 'File is too small. Minimum size is 1KB');
  }

  if (file.size > maxSize) {
    throw new ApiError(
      400,
      `File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
    );
  }
};

/**
 * Get resource type based on MIME type
 */
const getResourceType = (mimetype: string): 'image' | 'raw' => {
  if (mimetype.startsWith('image/')) {
    return 'image';
  }
  return 'raw'; // PDFs and other documents
};

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  options: FileUploadOptions
): Promise<UploadResult> => {
  // Validate file
  validateFile(file, options);

  return new Promise((resolve, reject) => {
    const resourceType = options.resourceType || getResourceType(file.mimetype);
    
    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        access_mode: 'authenticated', // Secure access
        type: 'private', // Private upload for security
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new ApiError(500, 'Failed to upload file to cloud storage'));
          return;
        }

        if (!result) {
          reject(new ApiError(500, 'No response from cloud storage'));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          original_filename: file.originalname,
        });
      }
    );

    // Write buffer to stream
    uploadStream.end(file.buffer);
  });
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  options: FileUploadOptions
): Promise<UploadResult[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, options));
  return Promise.all(uploadPromises);
};

/**
 * Delete file from Cloudinary (admin use only)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' = 'raw'
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: 'private',
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

/**
 * Log file upload to audit log
 */
export const logFileUpload = async (
  userId: string,
  entity: string,
  entityId: string,
  fileName: string,
  action: string = 'UPLOAD'
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
      },
    });
  } catch (error) {
    console.error('Failed to log file upload:', error);
    // Don't throw - audit log failure shouldn't break upload
  }
};

/**
 * Check if case is submitted to court (blocks police uploads)
 */
export const isCaseSubmittedToCourt = async (caseId: string): Promise<boolean> => {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      state: true,
    },
  });

  if (!caseData) {
    throw new ApiError(404, 'Case not found');
  }

  // Check if case has been submitted to court
  const courtSubmittedStates = [
    'SUBMITTED_TO_COURT',
    'COURT_ACCEPTED',
    'TRIAL_ONGOING',
    'JUDGMENT_RESERVED',
    'DISPOSED',
    'ARCHIVED',
  ];

  return caseData.state ? courtSubmittedStates.includes(caseData.state.currentState) : false;
};

/**
 * Validate police can upload (not after court submission)
 */
export const validatePoliceCanUpload = async (
  caseId: string,
  userRole: string
): Promise<void> => {
  // Only restrict Police uploads, not Court users
  if (userRole === 'POLICE' || userRole === 'SHO') {
    const isSubmitted = await isCaseSubmittedToCourt(caseId);
    if (isSubmitted) {
      throw new ApiError(
        403,
        'Cannot upload files after case has been submitted to court'
      );
    }
  }
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  logFileUpload,
  isCaseSubmittedToCourt,
  validatePoliceCanUpload,
  CloudinaryFolder,
};
