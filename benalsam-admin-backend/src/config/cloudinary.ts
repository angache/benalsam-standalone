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
  resource_type: 'image' as const
};

// Inventory specific upload options
export const inventoryUploadOptions = {
  folder: 'benalsam/inventory',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  transformation: [
    { width: 1200, height: 800, crop: 'fill' },
    { quality: 'auto', format: 'auto' }
  ],
  resource_type: 'image' as const,
  eager: [
    { width: 400, height: 300, crop: 'fill', quality: 'auto' }, // Thumbnail
    { width: 800, height: 600, crop: 'fill', quality: 'auto' }  // Medium
  ],
  eager_async: true,
  eager_notification_url: process.env.CLOUDINARY_WEBHOOK_URL
};

// Cloudinary delete options
export const cloudinaryDeleteOptions = {
  resource_type: 'image' as const
};
