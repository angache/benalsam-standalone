/**
 * Upload Service Validation Utilities
 * 
 * @fileoverview Validation functions for upload requests
 * @author Benalsam Team
 * @version 1.0.0
 */

import { AuthenticatedRequest, ValidationError, UploadType } from '../types/upload';

/**
 * Validates user authentication
 */
export function validateUserAuthentication(req: AuthenticatedRequest): string {
  const userId = req.headers['x-user-id'] || req.user?.id;
  
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User authentication required');
  }
  
  return userId;
}

/**
 * Validates file upload request
 */
export function validateFileUpload(req: AuthenticatedRequest, type: UploadType): Express.Multer.File[] {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    throw new ValidationError(`No images provided for ${type} upload`);
  }
  
  // Validate each file
  files.forEach((file, index) => {
    validateFile(file, index);
  });
  
  return files;
}

/**
 * Validates single file upload request
 */
export function validateSingleFileUpload(req: AuthenticatedRequest, type: UploadType): Express.Multer.File {
  const file = req.file;
  
  if (!file) {
    throw new ValidationError(`No image provided for ${type} upload`);
  }
  
  validateFile(file, 0);
  return file;
}

/**
 * Validates individual file
 */
function validateFile(file: Express.Multer.File, index: number): void {
  // Check if file exists
  if (!file) {
    throw new ValidationError(`File at index ${index} is missing`);
  }
  
  // Debug log for file validation
  console.log(`🔍 Validating file ${index}:`, {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    fieldname: file.fieldname,
    encoding: file.encoding
  });
  
  // Check file size
  const maxSize = parseInt(process.env.RATE_LIMIT_MAX_FILE_SIZE || '10485760'); // 10MB
  if (file.size > maxSize) {
    throw new ValidationError(
      `File at index ${index} exceeds maximum size limit of ${maxSize} bytes`
    );
  }
  
  // Check MIME type
  if (!file.mimetype.startsWith('image/')) {
    console.error(`❌ Invalid file type detected:`, {
      index,
      mimetype: file.mimetype,
      originalname: file.originalname
    });
    throw new ValidationError(
      `File at index ${index} is not an image. MIME type: ${file.mimetype}`
    );
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const mimeExtensionMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  const originalName = file.originalname || '';
  let fileExtension = '';

  // Try to read extension from original file name
  const lastDotIndex = originalName.lastIndexOf('.');
  if (lastDotIndex !== -1 && lastDotIndex < originalName.length - 1) {
    fileExtension = originalName.toLowerCase().substring(lastDotIndex);
  } else {
    // Fallback: derive extension from MIME type (for names like "blob")
    const derivedExt = mimeExtensionMap[file.mimetype];
    if (derivedExt) {
      fileExtension = derivedExt;
      console.warn(`ℹ️ Derived file extension from mimetype for index ${index}:`, {
        originalname: originalName,
        mimetype: file.mimetype,
        derivedExtension: derivedExt,
      });
    } else {
      fileExtension = '';
    }
  }
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new ValidationError(
      `File at index ${index} has unsupported extension: ${fileExtension || originalName || 'unknown'}`
    );
  }
  
  // Check if file has content
  if (file.size === 0) {
    throw new ValidationError(`File at index ${index} is empty`);
  }
}

/**
 * Validates image ID parameter
 */
export function validateImageId(req: AuthenticatedRequest): string {
  const { id } = req.params;
  
  if (!id || typeof id !== 'string') {
    throw new ValidationError('Image ID is required');
  }
  
  // Basic validation for Cloudinary public ID format
  if (id.length < 3 || id.length > 100) {
    throw new ValidationError('Invalid image ID format');
  }
  
  return id;
}

/**
 * Validates upload type
 */
export function validateUploadType(type: string): UploadType {
  const validTypes: UploadType[] = ['listings', 'inventory', 'profile'];
  
  if (!validTypes.includes(type as UploadType)) {
    throw new ValidationError(`Invalid upload type: ${type}. Valid types: ${validTypes.join(', ')}`);
  }
  
  return type as UploadType;
}

/**
 * Validates file count for batch uploads
 */
export function validateFileCount(files: Express.Multer.File[], maxFiles: number = 10): void {
  if (files.length > maxFiles) {
    throw new ValidationError(
      `Too many files. Maximum ${maxFiles} files allowed per request`
    );
  }
}

/**
 * Validates total upload size
 */
export function validateTotalSize(files: Express.Multer.File[], maxTotalSize: number = 50 * 1024 * 1024): void { // 50MB
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  if (totalSize > maxTotalSize) {
    throw new ValidationError(
      `Total upload size exceeds limit. Maximum ${maxTotalSize} bytes allowed`
    );
  }
}
