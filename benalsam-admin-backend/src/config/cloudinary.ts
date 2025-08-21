import { v2 as cloudinary } from 'cloudinary';
import logger from './logger';

// Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  logger.error('❌ Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

logger.info('✅ Cloudinary configured successfully');

export default cloudinary;

// Cloudinary upload options
export const cloudinaryUploadOptions = {
  folder: 'benalsam/listings',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  transformation: [
    { width: 800, height: 600, crop: 'fill' },
    { quality: 'auto', format: 'auto' }
  ],
  resource_type: 'image'
};

// Cloudinary delete options
export const cloudinaryDeleteOptions = {
  resource_type: 'image'
};
